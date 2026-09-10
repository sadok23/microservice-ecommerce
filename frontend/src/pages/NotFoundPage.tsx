import Button from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="gradient-brand-bg bg-clip-text text-8xl font-black text-transparent" aria-hidden>
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Page not found
      </h1>
      <p className="mt-2 mb-8 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        The page you're looking for doesn't exist or has moved. Let's get you back to the shop.
      </p>
      <Button to="/" size="lg">
        ← Back to products
      </Button>
    </div>
  );
}