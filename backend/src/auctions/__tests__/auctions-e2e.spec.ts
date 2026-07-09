import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { AuctionsService } from "../auctions.service";
import { Auction } from "../auction.entity";
import { AuctionBid } from "../auction-bid.entity";
import { MessagesGateway } from "../../messages/messages.gateway";

describe("Auctions E2E - In-Memory", () => {
  let service: AuctionsService;

  const auctions = new Map<string, any>();
  const bids = new Map<string, any>();
  const wsEvents: any[] = [];

  let auctionIdCounter = 0;
  let bidIdCounter = 0;

  const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  };

  const mockBidsRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  };

  const mockDataSource = { query: jest.fn() };
  const mockGateway = { notifyNewBid: jest.fn() };

  function setupMocks() {
    auctionIdCounter = 0;
    bidIdCounter = 0;

    mockRepo.create.mockImplementation((data: any) => ({ ...data }));

    mockRepo.save.mockImplementation((entity: any) => {
      if (!entity.id) {
        auctionIdCounter++;
        entity.id = `auction-${auctionIdCounter}`;
      }
      auctions.set(entity.id, { ...entity });
      return Promise.resolve(auctions.get(entity.id));
    });

    mockRepo.findOne.mockImplementation((opts: any) => {
      const { where } = opts;
      if (where.id) {
        const a = auctions.get(where.id);
        return Promise.resolve(a ? { ...a } : null);
      }
      if (where.product_id) {
        for (const a of auctions.values()) {
          if (a.product_id === where.product_id) return Promise.resolve({ ...a });
        }
      }
      return Promise.resolve(null);
    });

    mockRepo.find.mockImplementation((opts: any) => {
      const { where, order, take, skip } = opts;
      let results: any[] = [];
      for (const a of auctions.values()) {
        let match = true;
        if (where.estado && a.estado !== where.estado) match = false;
        if (where.fecha_fin && match) {
          const dateVal =
            where.fecha_fin._value !== undefined
              ? where.fecha_fin._value
              : where.fecha_fin;
          if (dateVal && !(new Date(a.fecha_fin) < dateVal)) match = false;
        }
        if (match) results.push({ ...a });
      }
      if (order?.fecha_fin === "ASC") {
        results.sort(
          (a, b) =>
            new Date(a.fecha_fin).getTime() - new Date(b.fecha_fin).getTime(),
        );
      }
      if (order?.updated_at === "DESC") {
        results.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime(),
        );
      }
      if (skip) results = results.slice(skip);
      if (take) results = results.slice(0, take);
      return Promise.resolve(results);
    });

    mockRepo.count.mockResolvedValue(0);

    mockBidsRepo.create.mockImplementation((data: any) => ({ ...data }));

    mockBidsRepo.save.mockImplementation((entity: any) => {
      if (!entity.id) {
        bidIdCounter++;
        entity.id = `bid-${bidIdCounter}`;
      }
      bids.set(entity.id, { ...entity });
      return Promise.resolve(bids.get(entity.id));
    });

    mockBidsRepo.findOne.mockImplementation((opts: any) => {
      const { where, order } = opts;
      if (where.id) {
        const b = bids.get(where.id);
        return Promise.resolve(b ? { ...b } : null);
      }
      if (where.auction_id && where.estado) {
        let matching: any[] = [];
        for (const b of bids.values()) {
          if (
            b.auction_id === where.auction_id &&
            b.estado === where.estado
          ) {
            matching.push(b);
          }
        }
        if (order?.monto === "DESC") {
          matching.sort((a, b) => b.monto - a.monto);
        }
        return Promise.resolve(matching.length > 0 ? { ...matching[0] } : null);
      }
      return Promise.resolve(null);
    });

    mockBidsRepo.find.mockImplementation((opts: any) => {
      const { where, order, take } = opts;
      let results: any[] = [];
      for (const b of bids.values()) {
        let match = true;
        if (where.auction_id && b.auction_id !== where.auction_id) match = false;
        if (match) results.push({ ...b });
      }
      if (order?.monto === "DESC") {
        results.sort((a, b) => b.monto - a.monto);
      }
      if (take) results = results.slice(0, take);
      return Promise.resolve(results);
    });

    mockBidsRepo.count.mockImplementation((opts: any) => {
      const { where } = opts;
      let count = 0;
      for (const b of bids.values()) {
        if (where.auction_id && b.auction_id !== where.auction_id) continue;
        if (where.estado && b.estado !== where.estado) continue;
        count++;
      }
      return Promise.resolve(count);
    });

    mockDataSource.query.mockImplementation((sql: string, params?: any[]) => {
      if (sql.includes("SELECT remaining_order_id")) {
        const auctionId = params?.[0];
        const a = auctions.get(auctionId);
        return Promise.resolve([
          { remaining_order_id: a?.remaining_order_id || null },
        ]);
      }
      if (sql.includes("UPDATE auction_bids SET estado")) {
        const [auctionId, excludeId] = params || [];
        for (const [id, bid] of bids) {
          if (
            bid.auction_id === auctionId &&
            bid.id !== excludeId &&
            bid.estado === "confirmada"
          ) {
            bids.set(id, { ...bid, estado: "perdida" });
          }
        }
        return Promise.resolve([]);
      }
      if (sql.includes("SELECT ab.monto")) {
        const bidId = params?.[0];
        const bid = bids.get(bidId);
        return Promise.resolve([
          {
            monto: bid?.monto || 0,
            checkout_id: "test",
            guarantee_paid: 10,
          },
        ]);
      }
      if (sql.includes("INSERT INTO orders")) {
        return Promise.resolve([{ id: "remaining-1" }]);
      }
      if (sql.includes("INSERT INTO order_items")) {
        return Promise.resolve([]);
      }
      if (sql.includes("UPDATE auctions SET remaining_order_id")) {
        const [remainingOrderId, auctionId] = params || [];
        const a = auctions.get(auctionId);
        if (a) {
          auctions.set(auctionId, { ...a, remaining_order_id: remainingOrderId });
        }
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    mockGateway.notifyNewBid.mockImplementation(
      (productId: string, data: any) => {
        wsEvents.push({ productId, data });
      },
    );
  }

  function futureMinute(): string {
    return new Date(Date.now() + 60000).toISOString();
  }

  function pastHour(): string {
    return new Date(Date.now() - 3600000).toISOString();
  }

  beforeEach(async () => {
    auctions.clear();
    bids.clear();
    wsEvents.length = 0;
    jest.clearAllMocks();
    setupMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuctionsService,
        { provide: getRepositoryToken(Auction), useValue: mockRepo },
        { provide: getRepositoryToken(AuctionBid), useValue: mockBidsRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: MessagesGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<AuctionsService>(AuctionsService);
  });

  test("Flujo completo: Crear → Pujar → Confirmar → Cerrar → Ganador", async () => {
    // 1. Create auction
    const auction = await service.create({
      product_id: "prod-001",
      vendedor_id: "seller-123",
      precio_inicial: 100,
      incremento_minimo: 10,
      fecha_fin: futureMinute(),
    });
    expect(auction.product_id).toBe("prod-001");
    expect(auction.estado).toBe("activo");
    expect(auction.precio_actual).toBe(100);

    // 2. Buyer 1 places bid of 150
    const bid1 = await service.placeBid(auction.id, "buyer-456", 150);
    expect(bid1.monto).toBe(150);
    expect(bid1.estado).toBe("pendiente");

    // 3. Buyer 2 places higher bid of 200
    const bid2 = await service.placeBid(auction.id, "buyer-789", 200);
    expect(bid2.monto).toBe(200);
    expect(bid2.estado).toBe("pendiente");

    // 4. Admin confirms both bids
    await service.confirmBid(bid1.id);
    await service.confirmBid(bid2.id);

    // 5. Verify precio_actual=200, bid_count=2, highest_bid=200
    const activeState = await service.findByProduct("prod-001")!;
    expect(activeState!.precio_actual).toBe(200);
    expect(activeState!.bid_count).toBe(2);
    expect(activeState!.highest_bid).toBe(200);

    // 6. Simulate time passing: modify fecha_fin to the past
    const stored = auctions.get(auction.id);
    auctions.set(auction.id, {
      ...stored,
      fecha_fin: new Date(Date.now() - 3600000),
    });

    // 7. Run closeExpired()
    const closedCount = await service.closeExpired();
    expect(closedCount).toBe(1);

    // 8. Verify auction estado="cerrado", ganador_id="buyer-789"
    const closedAuction = await service.findByProduct("prod-001")!;
    expect(closedAuction!.estado).toBe("cerrado");
    expect(closedAuction!.ganador_id).toBe("buyer-789");

    // 9. Verify loser bid (buyer-456) has estado="perdida"
    const loserBid = Array.from(bids.values()).find(
      (b) => b.postor_id === "buyer-456",
    );
    expect(loserBid).toBeDefined();
    expect(loserBid!.estado).toBe("perdida");

    // 10. Verify WebSocket event emitted with estado="cerrado" and ganador_id
    const closeEvent = wsEvents.find((e) => e.data.estado === "cerrado");
    expect(closeEvent).toBeDefined();
    expect(closeEvent.data.ganador_id).toBe("buyer-789");
    expect(closeEvent.data.precio_actual).toBe(200);
  });

  test("Subasta sin pujas no declara ganador", async () => {
    const auction = await service.create({
      product_id: "prod-002",
      vendedor_id: "seller-123",
      precio_inicial: 100,
      incremento_minimo: 10,
      fecha_fin: pastHour(),
    });

    const closedCount = await service.closeExpired();
    expect(closedCount).toBe(1);

    const result = await service.findByProduct("prod-002")!;
    expect(result!.estado).toBe("cerrado");
    expect(result!.ganador_id).toBeNull();
  });

  test("closeIfExpired cierra en tiempo real al consultar", async () => {
    await service.create({
      product_id: "prod-003",
      vendedor_id: "seller-123",
      precio_inicial: 100,
      incremento_minimo: 10,
      fecha_fin: pastHour(),
    });

    const result = await service.findByProduct("prod-003")!;
    expect(result!.estado).toBe("cerrado");
    expect(result!.ganador_id).toBeNull();
  });

  test("placeBid rechaza y cierra si ya expiro", async () => {
    const auction = await service.create({
      product_id: "prod-004",
      vendedor_id: "seller-123",
      precio_inicial: 100,
      incremento_minimo: 10,
      fecha_fin: pastHour(),
    });

    await expect(
      service.placeBid(auction.id, "buyer-456", 150),
    ).rejects.toThrow("La subasta ya terminó");

    const result = await service.findByProduct("prod-004")!;
    expect(result!.estado).toBe("cerrado");
    expect(result!.ganador_id).toBeNull();
  });
});
