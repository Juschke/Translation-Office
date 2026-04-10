import { useState, useCallback, useMemo } from 'react';

/**
 * Validation function signature
 */
export type ValidationSchema<T> = (data: T) => Partial<Record<keyof T, string>>;

/**
 * Form state hook configuration
 */
interface UseFormStateConfig<T> {
  /**
   * Initial form data
   */
  initialValues: T;

  /**
   * Optional validation schema or function
   */
  validationSchema?: ValidationSchema<T>;

  /**
   * Callback when form is submitted
   */
  onSubmit?: (data: T) => Promise<void> | void;
}

/**
 * Form state hook return type
 */
interface UseFormStateReturn<T> {
  /**
   * Current form data
   */
  formData: T;

  /**
   * Validation errors
   */
  errors: Partial<Record<keyof T, string>>;

  /**
   * Touched fields (for showing errors only after interaction)
   */
  touched: Partial<Record<keyof T, boolean>>;

  /**
   * Whether form is currently submitting
   */
  isSubmitting: boolean;

  /**
   * Whether form has been modified
   */
  isDirty: boolean;

  /**
   * Handle field change
   */
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;

  /**
   * Handle field blur (marks field as touched)
   */
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;

  /**
   * Handle form submit
   */
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;

  /**
   * Set a specific field value
   */
  setFieldValue: (field: keyof T, value: any) => void;

  /**
   * Reset form to initial values
   */
  reset: () => void;

  /**
   * Set form data directly
   */
  setFormData: (data: T) => void;

  /**
   * Set errors directly
   */
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;

  /**
   * Mark field as touched
   */
  setFieldTouched: (field: keyof T, isTouched: boolean) => void;

  /**
   * Validate specific field
   */
  validateField: (field: keyof T) => string | undefined;

  /**
   * Validate entire form
   */
  validateForm: () => boolean;
}

/**
 * Zentrale Form State Verwaltungs-Hook
 * Vereinheitlicht Form-Handling in NewProjectModal, NewCustomerModal, Settings, etc.
 *
 * @example
 * const { formData, errors, touched, handleChange, handleSubmit } = useFormState({
 *   initialValues: { name: '', email: '' },
 *   validationSchema: (data) => {
 *     const errors: any = {};
 *     if (!data.name) errors.name = 'Name erforderlich';
 *     return errors;
 *   },
 *   onSubmit: async (data) => {
 *     await api.post('/submit', data);
 *   }
 * });
 */
export function useFormState<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormStateConfig<T>): UseFormStateReturn<T> {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Check if form has been modified
   */
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialValues);
  }, [formData, initialValues]);

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (field: keyof T): string | undefined => {
      if (!validationSchema) return undefined;

      const fieldErrors = validationSchema(formData);
      return fieldErrors[field];
    },
    [formData, validationSchema]
  );

  /**
   * Validate entire form
   */
  const validateForm = useCallback((): boolean => {
    if (!validationSchema) return true;

    const newErrors = validationSchema(formData);
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }, [formData, validationSchema]);

  /**
   * Handle field change
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setFormData((prev) => ({
        ...prev,
        [name]: fieldValue,
      }));

      // Clear error for this field when user starts typing
      if (errors[name as keyof T]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name as keyof T];
          return newErrors;
        });
      }
    },
    [errors]
  );

  /**
   * Handle field blur (mark as touched)
   */
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name } = e.target;

      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      // Validate field on blur
      const fieldError = validateField(name as keyof T);
      if (fieldError) {
        setErrors((prev) => ({
          ...prev,
          [name]: fieldError,
        }));
      }
    },
    [validateField]
  );

  /**
   * Handle form submit
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate form
      if (!validateForm()) {
        return;
      }

      // Mark all fields as touched
      const allTouched = Object.keys(formData).reduce(
        (acc, key) => ({
          ...acc,
          [key]: true,
        }),
        {} as Partial<Record<keyof T, boolean>>
      );
      setTouched(allTouched);

      // Call onSubmit callback
      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(formData);
        } catch (error) {
          console.error('Form submission error:', error);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [formData, onSubmit, validateForm]
  );

  /**
   * Set specific field value
   */
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * Reset form to initial values
   */
  const resetForm = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  /**
   * Mark field as touched
   */
  const setFieldTouched = useCallback((field: keyof T, isTouched: boolean) => {
    setTouched((prev) => ({
      ...prev,
      [field]: isTouched,
    }));
  }, []);

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    reset: resetForm,
    setFormData,
    setErrors,
    setFieldTouched,
    validateField,
    validateForm,
  };
}
