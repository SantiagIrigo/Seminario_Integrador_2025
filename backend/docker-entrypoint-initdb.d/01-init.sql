-- Asegurarse de que la base de datos existe
SELECT 'CREATE DATABASE autogestion'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'autogestion')\gexec

-- Conectarse a la base de datos
\c autogestion

-- Crear extensiones si son necesarias
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Otros comandos de inicialización pueden ir aquí
