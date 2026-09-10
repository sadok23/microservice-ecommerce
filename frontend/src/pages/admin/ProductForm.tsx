import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import keycloak from '@/keycloak';
import { createProduct, updateProduct } from '@/api/client';
import type { Product } from '@/types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';

interface ProductFormProps {
  open: boolean;
  /** null = create mode; otherwise pre-fills the form for editing. */
  product: Product | null;
  onClose: () => void;
}

interface FormState {
  name: string;
  price: string;
  category: string;
  description: string;
  imageUrl: string;
}

const emptyForm = (product: Product | null): FormState => ({
  name: product?.name ?? '',
  price: product ? String(product.price) : '',
  category: product?.category ?? '',
  description: product?.description ?? '',
  imageUrl: product?.imageUrl ?? '',
});

/**
 * Shared create/edit product form shown inside a modal from the admin
 * product table. Validates locally, then POSTs or PUTs and refreshes
 * the catalog cache.
 */
export default function ProductForm({ open, product, onClose }: ProductFormProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? `Edit ${product.name}` : 'New Product'}
      size="lg"
    >
      {/* Keying by product re-seeds state whenever the target changes. */}
      <ProductFormFields key={product?.id ?? 'new'} product={product} onClose={onClose} />
    </Modal>
  );
}

function ProductFormFields({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(emptyForm(product));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        category: form.category.trim() || undefined,
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
      };
      return product
        ? updateProduct(keycloak, product.id, payload)
        : createProduct(keycloak, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(product ? 'Product updated' : 'Product created');
      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    },
  });

  const validate = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Name is required';
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) next.price = 'Enter a valid price';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) mutation.mutate();
  };

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField label="Name" required error={errors.name}>
        {(id) => (
          <Input
            id={id}
            value={form.name}
            onChange={set('name')}
            placeholder="Wireless Mouse"
            autoFocus
          />
        )}
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Price (USD)" required error={errors.price}>
          {(id) => (
            <Input
              id={id}
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={set('price')}
              placeholder="29.99"
            />
          )}
        </FormField>
        <FormField label="Category">
          {(id) => (
            <Input
              id={id}
              value={form.category}
              onChange={set('category')}
              placeholder="Electronics"
            />
          )}
        </FormField>
      </div>

      <FormField label="Description">
        {(id) => (
          <Textarea
            id={id}
            rows={3}
            value={form.description}
            onChange={set('description')}
            placeholder="Optional product description"
          />
        )}
      </FormField>

      <FormField label="Image URL" hint="Optional — falls back to a placeholder image">
        {(id) => (
          <Input
            id={id}
            value={form.imageUrl}
            onChange={set('imageUrl')}
            placeholder="https://example.com/image.jpg"
          />
        )}
      </FormField>

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
          {form.imageUrl.trim() ? (
            <img
              src={form.imageUrl.trim()}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                // Broken URL → hide the image, show the chip.
                (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl" aria-hidden>
              🖼️
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">Live image preview</p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={mutation.isPending}>
          {product ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}