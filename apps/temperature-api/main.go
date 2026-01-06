package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
    "math/rand/v2"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize router
	router := gin.Default()

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	router.GET("/temperature", func(c *gin.Context) {
        location := c.Query("location")
        var sensorID string
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
        // Return the temperature data
        c.JSON(http.StatusOK, gin.H{
            "sensor_id":   sensorID,
            "location":    location,
            "value":       20 + float64(int(rand.Float64() * 100))/10,
            "unit":        "°C",
            "status":      "OK",
            "timestamp":   time.Now(),
            "description": "",
        })
    })

	router.GET("/temperature/:sensorID", func(c *gin.Context) {
        sensorID := c.Param("sensorID")
        var location string
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
        // Return the temperature data
        c.JSON(http.StatusOK, gin.H{
            "sensor_id":   sensorID,
            "location":    location,
            "value":       20 + float64(int(rand.Float64() * 100))/10,
            "unit":        "°C",
            "status":      "OK",
            "timestamp":   time.Now(),
            "description": "",
        })
    })

	// Start server
	srv := &http.Server{
		Addr:    getEnv("PORT", ":8081"),
		Handler: router,
	}

	// Start the server in a goroutine
	go func() {
		log.Printf("Server starting on %s\n", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Create a deadline for server shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v\n", err)
	}

	log.Println("Server exited properly")
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
