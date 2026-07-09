import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { AuctionsService } from "../auctions.service";
import { Auction } from "../auction.entity";
import { AuctionBid } from "../auction-bid.entity";
import { MessagesGateway } from "../../messages/messages.gateway";

describe("AuctionsService", () => {
  let service: AuctionsService;

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

  const mockDataSource = {
    query: jest.fn(),
  };

  const mockGateway = {
    notifyNewBid: jest.fn(),
  };

  beforeEach(async () => {
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
    jest.clearAllMocks();
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  describe("findByProduct", () => {
    it("debe retornar null si no existe subasta", async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.findByProduct("non-existent");
      expect(result).toBeNull();
    });

    it("debe retornar subasta con bid_count y precio_actual", async () => {
      const auction = { id: "1", product_id: "p1", precio_inicial: 100, incremento_minimo: 10 };
      mockRepo.findOne.mockResolvedValue(auction);
      mockBidsRepo.count.mockResolvedValue(2);
      mockBidsRepo.findOne.mockResolvedValue({ monto: 150 });
      mockDataSource.query.mockResolvedValue([{ remaining_order_id: null }]);

      const result = await service.findByProduct("p1");
      expect(result).toMatchObject({
        product_id: "p1",
        bid_count: 2,
        highest_bid: 150,
        precio_actual: 150,
      });
    });
  });

  describe("placeBid", () => {
    it("debe rechazar puja en subasta propia", async () => {
      mockRepo.findOne.mockResolvedValue({
        id: "a1", estado: "activo", vendedor_id: "user1",
        fecha_fin: new Date(Date.now() + 86400000),
        precio_inicial: 100, incremento_minimo: 10,
      });

      await expect(service.placeBid("a1", "user1", 200))
        .rejects.toThrow("No puedes pujar en tu propia subasta");
    });

    it("debe rechazar puja menor al mínimo", async () => {
      mockRepo.findOne.mockResolvedValue({
        id: "a1", estado: "activo", vendedor_id: "seller1",
        fecha_fin: new Date(Date.now() + 86400000),
        precio_inicial: 100, incremento_minimo: 10,
      });
      mockBidsRepo.findOne.mockResolvedValue(null);
      mockBidsRepo.save.mockImplementation((b) => Promise.resolve(b));

      await expect(service.placeBid("a1", "buyer1", 50))
        .rejects.toThrow("La puja debe ser al menos");
    });
  });

  describe("closeExpired", () => {
    it("debe cerrar subastas expiradas sin pujas", async () => {
      const auction = {
        id: "a1", estado: "activo", product_id: "p1",
        precio_actual: 100, ganador_id: null,
      };
      mockRepo.find.mockResolvedValue([auction]);
      mockRepo.findOne.mockResolvedValue(auction);
      mockBidsRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockImplementation((a) => Promise.resolve(a));
      mockBidsRepo.count.mockResolvedValue(0);
      mockDataSource.query.mockResolvedValue([]);

      const count = await service.closeExpired();
      expect(count).toBe(1);
      expect(auction.estado).toBe("cerrado");
      expect(auction.ganador_id).toBeNull();
    });
  });
});
