import { useState, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { ZodError } from 'zod';
import type { ZodSchema, ZodIssue } from 'zod';

type FormErrors<T> = Partial<Record<keyof T, string>>;

export function useForm<T extends Record<string, unknown>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = useCallback(
    (field: keyof T) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValues((prev) => ({ ...prev, [field]: e.target.value }));
        // Clear error on change
        if (errors[field]) {
          setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
      },
    [errors]
  );

  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
    },
    []
  );

  const setValue = useCallback((field: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validate = useCallback(
    (schema: ZodSchema<unknown>): boolean => {
      try {
        schema.parse(values);
        setErrors({});
        return true;
      } catch (err) {
        if (err instanceof ZodError) {
          const fieldErrors: FormErrors<T> = {};
          const zodErr = err as ZodError;
          zodErr.issues.forEach((e: ZodIssue) => {
            const path = e.path[0] as keyof T;
            if (path && !fieldErrors[path]) {
              fieldErrors[path] = e.message;
            }
          });
          setErrors(fieldErrors);
        }
        return false;
      }
    },
    [values]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return { values, errors, touched, handleChange, handleBlur, setValue, validate, reset };
}
