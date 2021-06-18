const request = require("supertest");
const app = require("../../app");

describe("Integration test: set van status to ready)", () => {
  let agent = request.agent(app);
  let cookie = null;
  beforeAll(() =>
    agent
      .post("/vendor/sign-in")
      .set("Content-Type", "application/x-www-form-urlencoded")
      // send the username and password
      .send({
        van_name: "Supervan",
        password: "supervan1",
      })
      // when we get back the cookie, store it in a variable
      .then((res) => {
        cookie = res.headers["set-cookie"][0]
          .split(",")
          .map((item) => item.split(";")[0])
          .join(";");
      })
  );

  test("Set van to ready: Van id = (60b0f843c1aa117297feec77)", () => {
    return agent
      .get("/vendor/ready/60b0f843c1aa117297feec77")
      .set("Cookie", cookie)
      .then((response) => {
        // expect redirect code
        expect(response.statusCode).toBe(302);
        // expect it to be redirected to vendor/order if it succeeds
        expect(response.text).toContain("/vendor/order");
      });
  });

  test("Test wrong van id to ready: Van id = (607)", () => {
    return agent
      .get("/vendor/ready/607")
      .set("Cookie", cookie)
      .then((response) => {
        expect(response.statusCode).toBe(302);
        // expect it to be redirected to error page
        expect(response.text).toContain("/error");
      });
  });
});
