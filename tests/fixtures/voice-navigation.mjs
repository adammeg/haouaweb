// Synthetic navigation boundary for DOM tests; production uses Next's real router.
export const navigation = { pathname: "/dossier", pushed: [] };
export function usePathname() { return navigation.pathname; }
export function useRouter() { return { push: (href) => navigation.pushed.push(href) }; }
