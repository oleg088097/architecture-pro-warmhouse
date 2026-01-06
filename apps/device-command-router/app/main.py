from pydantic import BaseModel
from fastapi import BackgroundTasks, FastAPI
import json
import os
from confluent_kafka.admin import AdminClient, NewTopic
from confluent_kafka.aio import AIOProducer


class ConfigurationUpdate(BaseModel):
    deviceId: int
    config: str
    commandId: int

app = FastAPI()
kafka_server = os.getenv("KAFKA_SERVER", "localhost:9092")
producer: AIOProducer

admin_client = AdminClient({
    "bootstrap.servers": kafka_server
})
new_topics = [NewTopic(topic, num_partitions=3, replication_factor=1) for topic in ["warmhouse.ingress.configuration.processed"]]
admin_client.create_topics(new_topics)



async def publish_processed_config(message: dict):
    await producer.produce("warmhouse.ingress.configuration.processed", json.dumps(message).encode("utf-8"))

@app.on_event("startup")
async def startup_event():
    global producer
    producer = AIOProducer({"bootstrap.servers": kafka_server})

@app.on_event("shutdown")
async def shutdown_event():
    global producer
    await producer.stop()

@app.post("/device/{id}/config")
async def send_config(update: ConfigurationUpdate, background_tasks: BackgroundTasks):
    message = {"deviceId": update.deviceId, "config": update.config}
    background_tasks.add_task(publish_processed_config, message)
    return {
        "status": "ok"
    }

@app.get("/health")
async def send_config():
    return {
        "status": "ok"
    }
