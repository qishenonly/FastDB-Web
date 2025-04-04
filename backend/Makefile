.PHONY: build clean test run

# 默认目标
all: build

# 构建目标
build:
	@echo "Building FastDB-Web..."
	@go build -o bin/fastdb-web server/main.go

# 清理目标
clean:
	@echo "Cleaning..."
	@rm -rf bin/
	@rm -rf data/
	@rm -rf logs/

# 测试目标
test:
	@echo "Running tests..."
	@go test -v ./...

# 运行目标
run:
	@echo "Running FastDB-Web..."
	@go run server/main.go

# 安装依赖
deps:
	@echo "Installing dependencies..."
	@go mod tidy

# 生成文档
docs:
	@echo "Generating API documentation..."
	@swag init -g server/main.go -o docs/swagger 