import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { ErrorMessage, Field, TextInput } from "../../components/ui/inputs";
import { PageHeader } from "../../components/ui/inputs";
import { createClass } from "../../services/apiClient";
import { AuthError } from "../../services/authService";

export function CreateClass() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (name.trim().length < 1) next.name = "Please enter a class name.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(undefined);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await createClass({ name, description });
      navigate(`/app/instructor/classes/${result.id}`);
    } catch (error) {
      const message = error instanceof AuthError ? error.message : "Unable to create class. Please try again.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cb-page-pad">
      <div className="cb-container" style={{ maxWidth: 600 }}>
        <PageHeader
          title="Create Class"
          subtitle="Give your class a name and optional description."
          actions={<Link to="/app/instructor/classes" className="cb-btn cb-btn-secondary cb-btn-sm">Back to classes</Link>}
        />

        <form onSubmit={(e) => void handleSubmit(e)} noValidate>
          <Field label="Class name" required error={errors.name}>
            <TextInput
              id="class-name"
              name="name"
              autoComplete="off"
              placeholder="e.g. Grade 7 Coding"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Description" hint="Optional description for your students.">
            <TextInput
              id="class-description"
              name="description"
              autoComplete="off"
              placeholder="e.g. Introduction to Python programming"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          {formError ? <ErrorMessage message={formError} /> : null}

          <div className="cb-hero-actions" style={{ marginTop: "var(--cb-space-6)", gap: "var(--cb-space-3)" }}>
            <Button type="submit" size="lg" loading={submitting} disabled={submitting}>
              Create Class
            </Button>
            <Link to="/app/instructor/classes" className="cb-btn cb-btn-secondary cb-btn-sm">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
