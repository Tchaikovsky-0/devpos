// Package sqlite3 is a pure-Go replacement for github.com/mattn/go-sqlite3.
// It delegates to modernc.org/sqlite (registered as "sqlite").
package sqlite3

import (
	"database/sql"
	"database/sql/driver"

	_ "modernc.org/sqlite"
)

var _ driver.Driver = (*wrapper)(nil)

type wrapper struct{}

// Open implements driver.Driver.Open by delegating to the modernc.org/sqlite driver.
// modernc.org/sqlite registers itself as "sqlite", but gorm expects "sqlite3".
func (w *wrapper) Open(dsn string) (driver.Conn, error) {
	// Get the registered sqlite driver (from modernc.org/sqlite via blank import above).
	d := getDriver()
	if d == nil {
		return nil, &badDriverError{name: "sqlite"}
	}
	return d.Open(dsn)
}

// getDriver returns the modernc.org/sqlite driver registered as "sqlite".
var getDriver = func() driver.Driver {
	db, err := sql.Open("sqlite", "")
	if err != nil || db == nil {
		return nil
	}
	defer db.Close()
	return db.Driver()
}

type badDriverError struct {
	name string
}

func (e *badDriverError) Error() string {
	return "bad driver: " + e.name
}

func init() {
	sql.Register("sqlite3", &wrapper{})
}
