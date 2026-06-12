"""Shared database connection helper."""
import os
import pyodbc

def get_conn():
    conn_str = os.environ["SQL_CONNECTION_STRING"]
    return pyodbc.connect(conn_str)
