import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({ children, href, ...props }: any) =>
    <a href={href} {...props}>{children}</a>;
  MockLink.displayName = "Link";
  return MockLink;
});

// Mock lucide-react
jest.mock("lucide-react", () => ({
  Search: (props: any) => <svg data-testid="icon-Search" {...props} />,
  Menu: (props: any) => <svg data-testid="icon-Menu" {...props} />,
  X: (props: any) => <svg data-testid="icon-X" {...props} />,
  Loader2: (props: any) => <svg data-testid="icon-Loader2" {...props} />,
  Tag: (props: any) => <svg data-testid="icon-Tag" {...props} />,
}));

// Mock API helpers
const mockGetActiveProducts = jest.fn();
jest.mock("@/lib/api", () => ({
  getProfile: jest.fn().mockRejectedValue(new Error("no session")),
  isAuthenticated: jest.fn().mockReturnValue(false),
  removeTokens: jest.fn(),
  getActiveProducts: (...args: any[]) => mockGetActiveProducts(...args),
  getImageUrl: (path: string) => path,
}));

// Mock UserMenu
jest.mock("@/components/layout/user-menu", () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}));

const mockProducts = [
  { id: "1", title: "Zapatos Nike Air", status: "active", specifications: { "Precio Unitario": "250" }, created_at: "2024-01-01" },
  { id: "2", title: "Zapatos Adidas", status: "active", specifications: { "Precio Unitario": "180" }, created_at: "2024-01-02" },
  { id: "3", title: "Zapatillas Puma", status: "active", specifications: {}, created_at: "2024-01-03" },
  { id: "4", title: "Zapatos de Cuero", status: "active", specifications: {}, created_at: "2024-01-04" },
];

describe("Header search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActiveProducts.mockResolvedValue(mockProducts);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders search input", async () => {
    const { Header } = await import("../header");
    render(<Header />);
    expect(screen.getByPlaceholderText("Buscar productos...")).toBeTruthy();
  });

  test("updates value on typing", async () => {
    const { Header } = await import("../header");
    render(<Header />);
    const input = screen.getByPlaceholderText("Buscar productos...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "zapatos" } });
    expect(input.value).toBe("zapatos");
  });

  test("does not fetch for fewer than 3 characters", async () => {
    const { Header } = await import("../header");
    render(<Header />);
    const input = screen.getByPlaceholderText("Buscar productos...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "za" } });
    jest.advanceTimersByTime(500);

    expect(mockGetActiveProducts).not.toHaveBeenCalled();
  });

  test("fetches products after 3+ characters with debounce", async () => {
    const { Header } = await import("../header");
    render(<Header />);
    const input = screen.getByPlaceholderText("Buscar productos...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "zapatos" } });
    expect(screen.queryByTestId("icon-Loader2")).toBeTruthy();

    jest.advanceTimersByTime(400);

    await waitFor(() => {
      expect(mockGetActiveProducts).toHaveBeenCalledWith(undefined, "zapatos", 5);
    });
  });

  test("shows dropdown with results after fetch", async () => {
    const { Header } = await import("../header");
    render(<Header />);
    const input = screen.getByPlaceholderText("Buscar productos...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "zapatos" } });
    jest.advanceTimersByTime(400);

    await waitFor(() => {
      expect(screen.getByText("Zapatos Nike Air")).toBeTruthy();
      expect(screen.getByText("Zapatos Adidas")).toBeTruthy();
    });

    // Should have "Ver todos los resultados" link
    expect(screen.getByText("Ver todos los resultados")).toBeTruthy();
  });

  test("shows price when available in results", async () => {
    const { Header } = await import("../header");
    render(<Header />);
    const input = screen.getByPlaceholderText("Buscar productos...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "zapatos" } });
    jest.advanceTimersByTime(400);

    await waitFor(() => {
      expect(screen.getByText("S/ 250")).toBeTruthy();
    });
  });

  test("closes dropdown on Escape key", async () => {
    const { Header } = await import("../header");
    render(<Header />);
    const input = screen.getByPlaceholderText("Buscar productos...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "zapatos" } });
    jest.advanceTimersByTime(400);

    await waitFor(() => {
      expect(screen.getByText("Zapatos Nike Air")).toBeTruthy();
    });

    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByText("Zapatos Nike Air")).toBeNull();
  });

  test("shows empty state when no results", async () => {
    mockGetActiveProducts.mockResolvedValue([]);

    const { Header } = await import("../header");
    render(<Header />);
    const input = screen.getByPlaceholderText("Buscar productos...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "xyzxyz" } });
    jest.advanceTimersByTime(400);

    await waitFor(() => {
      expect(screen.getByText("No se encontraron productos")).toBeTruthy();
    });
  });
});
