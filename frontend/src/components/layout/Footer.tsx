export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="page-container flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-gray-900 dark:text-gray-100">ShopMicro</span>
          <span className="text-gray-400 dark:text-gray-500">— a tiny, delightful storefront.</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600">
          © {new Date().getFullYear()} ShopMicro
        </p>
      </div>
    </footer>
  );
}