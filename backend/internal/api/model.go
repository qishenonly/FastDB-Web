package api

// KeyValuePair 表示一个键值对
type KeyValuePair struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// KeyValueRequest 表示设置键值的请求
type KeyValueRequest struct {
	Value string `json:"value" binding:"required"`
}

// KeyValueResponse 表示获取键值的响应
type KeyValueResponse struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// ConnectRequest 表示数据库连接请求
type ConnectRequest struct {
	Host     string `json:"host" binding:"required"`
	Port     string `json:"port" binding:"required"`
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// DBStatusRequest 表示数据库连接状态请求
type DBStatusRequest struct {
	Connect bool `json:"connect"`
}

// ListResponse 表示列出键值对的响应
type ListResponse struct {
	Total int               `json:"total"`
	Items map[string]string `json:"items"`
}

// Response 表示API响应
type Response struct {
	Status  string      `json:"status"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// ErrorResponse 表示错误响应
type ErrorResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

// ConnectResponse 表示数据库连接响应
type ConnectResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// DBStatusResponse 表示数据库连接状态响应
type DBStatusResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	details Detail `json:"details"`
}

// Detail 表示数据库连接详情信息
type Detail struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	Username string `json:"username"`
}
