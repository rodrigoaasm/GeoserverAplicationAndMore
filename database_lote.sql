CREATE TABLE lote
(
  id bigint NOT NULL,
  geometry geometry,
  CONSTRAINT lote_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE lote
  OWNER TO geoserver;
 
CREATE INDEX ind_lote
  ON lote
  USING gist
  (geometry);