import { FieldErrors } from "@/lib/admin/types";

export class AdminValidationError extends Error {
  fieldErrors: FieldErrors;

  constructor(message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = "AdminValidationError";
    this.fieldErrors = fieldErrors;
  }
}

