"use client";

import { useEffect } from "react";

type AutoSubmitFilterFormProps = {
  formId: string;
};

function isFilterControl(target: EventTarget | null): target is HTMLSelectElement | HTMLInputElement {
  if (!(target instanceof HTMLElement)) return false;

  if (target instanceof HTMLSelectElement) return true;

  if (target instanceof HTMLInputElement) {
    return target.type === "date" || target.type === "month";
  }

  return false;
}

export function AutoSubmitFilterForm({ formId }: AutoSubmitFilterFormProps) {
  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    let submitTimer: number | undefined;

    const handleChange = (event: Event) => {
      if (!isFilterControl(event.target)) return;

      if (submitTimer) {
        window.clearTimeout(submitTimer);
      }

      submitTimer = window.setTimeout(() => {
        form.requestSubmit();
      }, 80);
    };

    form.addEventListener("change", handleChange);

    return () => {
      form.removeEventListener("change", handleChange);
      if (submitTimer) {
        window.clearTimeout(submitTimer);
      }
    };
  }, [formId]);

  return null;
}
