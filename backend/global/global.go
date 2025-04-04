package global

import "FastDB-Web/internal/config"

var (
	G_Config *config.Config
)

const (
	// db
	G_FastDB_Host     = "localhost"
	G_FastDB_Port     = "8999"
	G_FastDB_UserName = "root"
	G_FastDB_Password = "root"
)
