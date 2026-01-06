package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Configuration struct {
	DeviceID   int    `json:"deviceId"`
	Version    int    `json:"version"`
	ReceivedAt int64  `json:"receivedAt"`
	Config     string `json:"config"`
}

type ConfigurationUpdateCommand struct {
	LastSeenConfigVersion int    `json:"lastSeenConfigVersion"`
	Config                string `json:"config"`
}

type ConfigurationUpdateResponse struct {
	DeviceID  int    `json:"deviceId"`
	CommandID int    `json:"commandId"`
	Config    string `json:"config"`
}

type ConfigurationService struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewConfigurationService(baseURL string) *ConfigurationService {
	return &ConfigurationService{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GetConfiguration fetches configuration for a specific device ID
func (s *ConfigurationService) GetConfiguration(deviceID int) (*Configuration, int, error) {
	url := fmt.Sprintf("%s/configuration/%d", s.BaseURL, deviceID)
	resp, err := s.HTTPClient.Get(url)
	if err != nil {
		return nil, 0, fmt.Errorf("error fetching configuration: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, resp.StatusCode, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var cfg Configuration
	if err := json.NewDecoder(resp.Body).Decode(&cfg); err != nil {
		return nil, resp.StatusCode, fmt.Errorf("error decoding configuration response: %w", err)
	}
	return &cfg, resp.StatusCode, nil
}

// UpdateConfiguration sends an update command for a specific device ID
func (s *ConfigurationService) UpdateConfiguration(deviceID int, cmd ConfigurationUpdateCommand) (*ConfigurationUpdateResponse, int, error) {
	url := fmt.Sprintf("%s/configuration/%d", s.BaseURL, deviceID)
	body, err := json.Marshal(cmd)
	if err != nil {
		return nil, 0, fmt.Errorf("error encoding update command: %w", err)
	}
	req, err := http.NewRequest(http.MethodPut, url, bytes.NewReader(body))
	if err != nil {
		return nil, 0, fmt.Errorf("error creating request: %w", err)
	}
	req.Header.Set("content-type", "application/json")

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return nil, 0, fmt.Errorf("error sending update request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted {
		// attempt to read body for debugging is intentionally skipped to keep client simple
		return nil, resp.StatusCode, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var updated ConfigurationUpdateResponse
	if err := json.NewDecoder(resp.Body).Decode(&updated); err != nil {
		return nil, resp.StatusCode, fmt.Errorf("error decoding update response: %w", err)
	}
	return &updated, resp.StatusCode, nil
}


