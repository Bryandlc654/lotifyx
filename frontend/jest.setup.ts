global.fetch = jest.fn().mockResolvedValue({
  json: () => Promise.resolve({}),
  ok: true,
}) as jest.Mock;
