package storage

import (
	"FastDB-Web/internal/config"
	"errors"
	"sync"

	fastdb "github.com/qishenonly/FastDB/db"
)

// KVStore 是KV存储的接口
type KVStore interface {
	Get(key []byte) ([]byte, error)
	Put(key, value []byte) error
	Delete(key []byte) error
	Fold(f func(key []byte, value []byte) bool) error
	GetListKeys() [][]byte

	Close() error
	Sync() error
}

// FastDBStore 是基于FastDB的KV存储实现
type FastDBStore struct {
	db *fastdb.DB
	mu sync.RWMutex
}

// NewKVStore 创建一个新的KV存储
func NewKVStore(cfg config.StorageConfig) (KVStore, error) {
	switch cfg.Type {
	case "fastdb":
		options := fastdb.DefaultOptions
		options.DirPath = "../fastdb"
		db, err := fastdb.NewFastDB(options)
		if err != nil {
			panic(err)
		}
		return &FastDBStore{db: db}, nil
	default:
		return nil, errors.New("unsupported storage type")
	}
}

// Get 获取键对应的值
func (s *FastDBStore) Get(key []byte) ([]byte, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.db.Get(key)
}

// Put 设置键值对
func (s *FastDBStore) Put(key, value []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.db.Put(key, value)
}

// Delete 删除键值对
func (s *FastDBStore) Delete(key []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.db.Delete(key)
}

// Close 关闭存储
func (s *FastDBStore) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.db.Close()
}

// Sync 持久化数据
func (s *FastDBStore) Sync() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.db.Sync()
}

// Fold 遍历所有键值对
func (s *FastDBStore) Fold(f func(key []byte, value []byte) bool) error {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.db.Fold(f)
}

// GetListKeys 获取所有的键
func (s *FastDBStore) GetListKeys() [][]byte {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.db.GetListKeys()
}
