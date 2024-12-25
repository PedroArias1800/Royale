CREATE TABLE types (
    types_id INTEGER NOT NULL,
    ml VARCHAR(10) NOT NULL,
    img VARCHAR(200) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    old_price NUMERIC(10,2) NOT NULL,
    status SMALLINT NOT NULL,
    parfum_id_fk INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Crear el trigger para actualizar la columna updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asociar el trigger a la tabla
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON types
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE version (
    version_id INTEGER NOT NULL,
    version_name VARCHAR(20) NOT NULL,
    description VARCHAR(300),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Crear una función para manejar el auto-actualizado del campo `updated_at`
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asociar el trigger a la tabla `version`
CREATE TRIGGER set_updated_at_version
BEFORE UPDATE ON version
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- Establecer claves primarias
ALTER TABLE body
  ADD PRIMARY KEY (body_id);

ALTER TABLE brand
  ADD PRIMARY KEY (brand_id);

ALTER TABLE parfum
  ADD PRIMARY KEY (parfum_id);

ALTER TABLE types
  ADD PRIMARY KEY (types_id);

ALTER TABLE version
  ADD PRIMARY KEY (version_id);

-- Crear índices
CREATE INDEX idx_parfum_id_fk ON body (parfum_id_fk);
CREATE INDEX idx_brand_id_fk ON parfum (brand_id_fk);
CREATE INDEX idx_version_id_fk ON parfum (version_id_fk);
CREATE INDEX idx_parfum_id_fk_types ON types (parfum_id_fk);


-- Crear secuencias para auto-incremento y configurarlas como valores predeterminados
CREATE SEQUENCE body_id_seq START 8;
ALTER TABLE body
  ALTER COLUMN body_id SET DEFAULT nextval('body_id_seq');

CREATE SEQUENCE brand_id_seq START 14;
ALTER TABLE brand
  ALTER COLUMN brand_id SET DEFAULT nextval('brand_id_seq');

CREATE SEQUENCE parfum_id_seq START 25;
ALTER TABLE parfum
  ALTER COLUMN parfum_id SET DEFAULT nextval('parfum_id_seq');

CREATE SEQUENCE types_id_seq START 43;
ALTER TABLE types
  ALTER COLUMN types_id SET DEFAULT nextval('types_id_seq');

CREATE SEQUENCE version_id_seq START 6;
ALTER TABLE version
  ALTER COLUMN version_id SET DEFAULT nextval('version_id_seq');
