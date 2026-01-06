# Project_template


# Задание 1. Анализ и планирование

### 1. Описание функциональности монолитного приложения

**Управление отоплением:**

- Пользователи могут удалённо включать/выключать отопление в своих домах.
- Система поддерживает отправку команд системам отопления в домах.

**Мониторинг температуры:**

- Пользователи могут просматривать текущую температуру в своих домах через веб-интерфейс.
- Система поддерживает получение данных о температуре через запрос к датчику.

### 2. Анализ архитектуры монолитного приложения

- **Язык программирования:** Go
- **База данных:** PostgreSQL
- **Архитектура:** Монолитная, все компоненты системы (обработка запросов, бизнес-логика, работа с данными) находятся в рамках одного приложения.
- **Взаимодействие:** Синхронное, запросы обрабатываются последовательно, всё взаимодействие идёт от сервера к датчикам.
- **Масштабируемость:** Ограничена, так как монолит сложно масштабировать по частям.
- **Развертывание:** Требует остановки всего приложения.

### 3. Определение доменов и границы контекстов

- Домен "Умный Дом"
    - Поддомен "Управление устройствами"
    - Поддомен "Мониторинг датчиков"

В текущей системе нет разграничения на отдельные контексты и вся система описана в одном контексте
- Контекст TemperatureManagement
    - entities: Sensor
    - value objects: TemperatureResponse
  
### **4. Проблемы монолитного решения**

- Evolvability:
    - Систему трудно расширить для работы с устройствами, не являющимися датчиками, что необходимо для планируемого расширения.
- Modularity:
    - Между функционалом управления устройствами и мониторинга датчиков высокий уровень coupling. Это затруднит независимое развитие функционала.
- Security:
    - Если приложение работает с физическими устройствами в домах клиентов, важно чтобы посторонние лица не могли посылать команды этим устройствам.
    - В системе нет разделения публичного API и внутреннего функционала. Все операции выполняются через API-запросы, это потенциально открывает уязвимости в системе.
- Scalability
    - Приложение масштабируется только вертикально, что ограничено и дорого. Масштабирование требуется для работы с увеличивающимся количеством клиентов и устройств.
- Fault-tolerance
    - Ошибка выполнения приведёт к недоступности всего приложения и длительному времени старта, свойственному монолитам.


### 5. Визуализация контекста системы — диаграмма С4

- /schemas/C4_context.svg

[![svg](/schemas/C4_context.svg)](https://raw.githubusercontent.com/oleg088097/architecture-pro-warmhouse/refs/heads/warmhouse/schemas/C4_context.svg)

# Задание 2. Проектирование микросервисной архитектуры

**Диаграмма контейнеров (Containers)**

- /schemas/C4_container.svg

  [![svg](/schemas/C4_container.svg)](https://raw.githubusercontent.com/oleg088097/architecture-pro-warmhouse/refs/heads/warmhouse/schemas/C4_container.svg)

**Диаграмма компонентов (Components)**

- /schemas/component/C4_component_user_device_service.svg

[![svg](/schemas/component/C4_component_user_device_service.svg)](https://raw.githubusercontent.com/oleg088097/architecture-pro-warmhouse/refs/heads/warmhouse/schemas/component/C4_component_user_device_service.svg)

- /schemas/component/C4_component_device_configuration_service.svg

[![svg](/schemas/component/C4_component_device_configuration_service.svg)](https://raw.githubusercontent.com/oleg088097/architecture-pro-warmhouse/refs/heads/warmhouse/schemas/component/C4_component_device_configuration_service.svg)

- /schemas/component/C4_component_device_access_service.svg

[![svg](/schemas/component/C4_component_device_access_service.svg)](https://raw.githubusercontent.com/oleg088097/architecture-pro-warmhouse/refs/heads/warmhouse/schemas/component/C4_component_device_access_service.svg)


**Диаграмма кода (Code)**

- /schemas/code/C4_code_device_configuration_service.svg

[![svg](/schemas/code/C4_code_device_configuration_service.svg)](https://raw.githubusercontent.com/oleg088097/architecture-pro-warmhouse/refs/heads/warmhouse/schemas/code/C4_code_device_configuration_service.svg)


# Задание 3. Разработка ER-диаграммы

- /schemas/er/C4_er.svg

[![svg](/schemas/er/C4_er.svg)](https://raw.githubusercontent.com/oleg088097/architecture-pro-warmhouse/refs/heads/warmhouse/schemas/er/C4_er.svg)

# Задание 4. Создание и документирование API

### 1. Тип API

- RestAPI для синхронных операций.
  - Синхронные операции в спроектированной архитектуре в основном представлены пользовательским API и сценариями пользователя
- AsyncAPI для асинхронных операций. 
  - Асинхронные операции в спроектированной архитектуре в основном представлены в потоках получения показаний/конфигурации/метаданных от устройств. 

### 2. Документация API

[api/asyncapi_device_configuration_service.yaml](api/asyncapi_device_configuration_service.yaml)

[api/openapi_device_access_service.yaml](api/openapi_device_access_service.yaml)

[api/openapi_device_configuration_service.yaml](api/openapi_device_configuration_service.yaml)

# Задание 5. Работа с docker и docker-compose

Перейдите в apps.

Там находится приложение-монолит для работы с датчиками температуры. В README.md описано как запустить решение.

Вам нужно:

1) сделать простое приложение temperature-api на любом удобном для вас языке программирования, которое при запросе /temperature?location= будет отдавать рандомное значение температуры.

Locations - название комнаты, sensorId - идентификатор названия комнаты

```
	// If no location is provided, use a default based on sensor ID
	if location == "" {
		switch sensorID {
		case "1":
			location = "Living Room"
		case "2":
			location = "Bedroom"
		case "3":
			location = "Kitchen"
		default:
			location = "Unknown"
		}
	}

	// If no sensor ID is provided, generate one based on location
	if sensorID == "" {
		switch location {
		case "Living Room":
			sensorID = "1"
		case "Bedroom":
			sensorID = "2"
		case "Kitchen":
			sensorID = "3"
		default:
			sensorID = "0"
		}
	}
```

2) Приложение следует упаковать в Docker и добавить в docker-compose. Порт по умолчанию должен быть 8081

3) Кроме того для smart_home приложения требуется база данных - добавьте в docker-compose файл настройки для запуска postgres с указанием скрипта инициализации ./smart_home/init.sql

Для проверки можно использовать Postman коллекцию smarthome-api.postman_collection.json и вызвать:

- Create Sensor
- Get All Sensors

Должно при каждом вызове отображаться разное значение температуры

Ревьюер будет проверять точно так же.


# **Задание 6. Разработка MVP**

В спроектированной архитектуре ожидается, что инициализация устройства в системе WarmHouse будет произведена в результате получения сообщений от модуля умного дома.

Источником правды относительно конфигурации модуля умного дома так же является сам модуль и его сообщения в систему WarmHouse.

В соответствие с этим, первоначальная инициализация конфигурации модуля в сервисе device-configuration-service происходит на основании получения сообщения из топика warmhouse.ingress.configuration.processed.

Для работы с сервисом можно напрямую вызвать device-command-router с желаемой конфигурацией. Роутер переправит конфигурацию в соответствующий топик в качестве имитации процесса применения конфигурации в модуле.
