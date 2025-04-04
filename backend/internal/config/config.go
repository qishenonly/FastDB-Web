package config

import (
	"encoding/json"
	"os"
)

// Config 包含应用程序的所有配置
type Config struct {
	Server  ServerConfig  `json:"server"`
	Storage StorageConfig `json:"storage"`
	Log     LogConfig     `json:"log"`
}

// ServerConfig 包含HTTP服务器的配置
type ServerConfig struct {
	Host string `json:"host"`
	Port string `json:"port"`
}

// StorageConfig 包含存储的配置
type StorageConfig struct {
	Type      string `json:"type"`
	Path      string `json:"path"`
	CacheSize int    `json:"cacheSize"`
}

// LogConfig 包含日志的配置
type LogConfig struct {
	Level         string `json:"level"`
	Format        string `json:"format"`
	Path          string `json:"path"`
	IsDevelopment bool   `json:"isDevelopment"`
}

// Load 从配置文件加载配置
func Load() (*Config, error) {
	// 默认配置
	cfg := &Config{
		Server: ServerConfig{
			Host: "0.0.0.0",
			Port: "8080",
		},
		Storage: StorageConfig{
			Type:      "leveldb",
			Path:      "./data",
			CacheSize: 1024,
		},
		Log: LogConfig{
			Level:  "info",
			Format: "json",
			Path:   "./logs",
		},
	}

	// 尝试从文件加载配置
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "config.json"
	}

	if _, err := os.Stat(configPath); err == nil {
		file, err := os.Open(configPath)
		if err != nil {
			return nil, err
		}
		defer file.Close()

		decoder := json.NewDecoder(file)
		if err := decoder.Decode(cfg); err != nil {
			return nil, err
		}
	}

	// 确保存储路径存在
	if err := os.MkdirAll(cfg.Storage.Path, 0755); err != nil {
		return nil, err
	}

	// 确保日志路径存在
	if err := os.MkdirAll(cfg.Log.Path, 0755); err != nil {
		return nil, err
	}

	return cfg, nil
}
