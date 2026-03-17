-- Add PatientDocument table for storing patient-uploaded documents

CREATE TABLE "patient_documents" (
    "id" TEXT NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "document_name" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_documents_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_hospital_id_fkey" 
    FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_patient_id_fkey" 
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for faster queries
CREATE INDEX "patient_documents_hospital_id_idx" ON "patient_documents"("hospital_id");
CREATE INDEX "patient_documents_patient_id_idx" ON "patient_documents"("patient_id");
CREATE INDEX "patient_documents_document_type_idx" ON "patient_documents"("document_type");
