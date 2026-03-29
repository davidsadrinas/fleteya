-- =============================================================================
-- 011: External Services — Identity Verification, Invoices, Cargo Insurance
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Identity Verifications (RENAPER / Nosis / 4identity)
-- ---------------------------------------------------------------------------
CREATE TABLE identity_verifications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id        uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  provider         text NOT NULL,
  document_type    text NOT NULL CHECK (document_type IN ('dni', 'license')),
  document_number  text NOT NULL,
  status           text NOT NULL CHECK (status IN ('pending', 'verified', 'rejected', 'error')),
  confidence       numeric(5,2),
  raw_response     jsonb DEFAULT '{}'::jsonb,
  rejection_reason text,
  verified_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_identity_verifications_driver ON identity_verifications(driver_id);

ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers ven sus verificaciones"
  ON identity_verifications FOR SELECT
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS identity_verification_id uuid REFERENCES identity_verifications(id);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_verification_id uuid REFERENCES identity_verifications(id);

-- ---------------------------------------------------------------------------
-- 2. Invoices (AFIP Facturación Electrónica)
-- ---------------------------------------------------------------------------
CREATE TYPE invoice_type   AS ENUM ('factura_b', 'factura_c', 'nota_credito_b', 'nota_credito_c');
CREATE TYPE invoice_status AS ENUM ('pending', 'issued', 'cancelled', 'error');

CREATE TABLE invoices (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id           uuid NOT NULL REFERENCES payments(id),
  shipment_id          uuid NOT NULL REFERENCES shipments(id),
  invoice_type         invoice_type NOT NULL,
  status               invoice_status NOT NULL DEFAULT 'pending',
  punto_venta          integer NOT NULL,
  numero_comprobante   bigint,
  cae                  text,
  cae_vencimiento      date,
  fecha_emision        date NOT NULL DEFAULT CURRENT_DATE,
  total                numeric(12,2) NOT NULL,
  neto                 numeric(12,2) NOT NULL,
  iva                  numeric(12,2) NOT NULL DEFAULT 0,
  receptor_tipo_doc    integer NOT NULL DEFAULT 99,
  receptor_nro_doc     text NOT NULL DEFAULT '0',
  receptor_nombre      text,
  raw_response         jsonb DEFAULT '{}'::jsonb,
  error_message        text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_payment  ON invoices(payment_id);
CREATE INDEX idx_invoices_shipment ON invoices(shipment_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus facturas"
  ON invoices FOR SELECT
  USING (shipment_id IN (SELECT id FROM shipments WHERE client_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. Cargo Insurance Policies
-- ---------------------------------------------------------------------------
CREATE TYPE cargo_insurance_status AS ENUM ('quoted', 'active', 'claimed', 'expired', 'cancelled');

CREATE TABLE cargo_insurance_policies (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id       uuid NOT NULL REFERENCES shipments(id),
  provider          text NOT NULL,
  policy_number     text,
  status            cargo_insurance_status NOT NULL DEFAULT 'quoted',
  declared_value    numeric(12,2) NOT NULL,
  premium           numeric(12,2) NOT NULL,
  deductible        numeric(12,2) DEFAULT 0,
  coverage_type     text NOT NULL DEFAULT 'basic',
  external_id       text,
  raw_response      jsonb DEFAULT '{}'::jsonb,
  claim_filed_at    timestamptz,
  claim_description text,
  claim_status      text,
  claim_resolution  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cargo_insurance_shipment ON cargo_insurance_policies(shipment_id);

ALTER TABLE cargo_insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven seguro de su envío"
  ON cargo_insurance_policies FOR SELECT
  USING (shipment_id IN (SELECT id FROM shipments WHERE client_id = auth.uid()));

ALTER TABLE shipments ADD COLUMN IF NOT EXISTS declared_value numeric(12,2);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS insurance_policy_id uuid REFERENCES cargo_insurance_policies(id);

-- ---------------------------------------------------------------------------
-- 4. OCR Results (cache de extracciones)
-- ---------------------------------------------------------------------------
CREATE TABLE ocr_extractions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id       uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  document_type   text NOT NULL CHECK (document_type IN ('dni_front', 'dni_back', 'license', 'insurance', 'vtv')),
  raw_text        text,
  fields          jsonb DEFAULT '{}'::jsonb,
  confidence      numeric(5,2),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ocr_extractions_driver ON ocr_extractions(driver_id);

ALTER TABLE ocr_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers ven sus OCR"
  ON ocr_extractions FOR SELECT
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 5. Notification log (WhatsApp, SMS, Email audit)
-- ---------------------------------------------------------------------------
CREATE TABLE notification_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel      text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'push')),
  event_type   text NOT NULL,
  recipient    text NOT NULL,
  status       text NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  provider     text,
  external_id  text,
  error        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_log_user ON notification_log(user_id);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus notificaciones"
  ON notification_log FOR SELECT
  USING (user_id = auth.uid());
