const mongoose = require("mongoose");
const van_controller = require("../../controllers/van_controller");
const Van = require("../../models/van");

describe("Testing set ready in van controller", () => {
  let res, req;
  // before each test mock the mongoose function
  beforeEach(() => {
    Van.findByIdAndUpdate = jest.fn().mockResolvedValue([
      {
        _id: "60b0f843c1aa117297feec77",
      },
    ]);
    res = {
      redirect: jest.fn(),
      text: jest.fn(),
    };
  });

  test("Testing correct id: should be redirected to order", async () => {
    req = {
      params: { id: "60b0f843c1aa117297feec77" },
      user: { _id: "60b0f843c1aa117297feec77" },
    };
    await van_controller.setReady(req, res);
    expect(res.redirect.mock.calls.length).toEqual(1);
    // expect page of redirect to be order
    expect(res.redirect.mock.calls[0][0]).toEqual("/vendor/order");
  });

  test("Testing wrong id: should be redirected to error page", async () => {
    req = {
      params: { id: "60b0f843c1aa117297feec77" },
      user: { _id: "123" },
    };
    await van_controller.setReady(req, res);
    // expect for redirect
    expect(res.redirect.mock.calls.length).toEqual(1);
    // expect page of redirect to be error
    expect(res.redirect.mock.calls[0][0]).toEqual("/error");
  });
});
