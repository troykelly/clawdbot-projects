-- Issue #9 rollback

DROP TRIGGER IF EXISTS trg_contact_endpoint_normalize ON contact_endpoint;
DROP FUNCTION IF EXISTS contact_endpoint_set_normalized_value();

DROP TABLE IF EXISTS contact_endpoint;
DROP FUNCTION IF EXISTS normalize_contact_endpoint_value(contact_endpoint_type, text);
DROP TYPE IF EXISTS contact_endpoint_type;

DROP TABLE IF EXISTS contact;
