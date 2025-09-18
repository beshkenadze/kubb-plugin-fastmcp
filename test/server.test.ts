import { execSync } from "child_process";
import { describe, expect, test } from "vitest";

const SERVER_PATH = "./test/generated/fastmcp/server.ts";
const MCP_INSPECTOR = "bunx @modelcontextprotocol/inspector";

function runMCPCommand(method: string, toolName?: string, args?: string[]): string {
  let cmd = `${MCP_INSPECTOR} --cli bun ${SERVER_PATH} --transport stdio --method ${method}`;

  if (toolName) {
    cmd += ` --tool-name ${toolName}`;
  }

  if (args && args.length > 0) {
    cmd += ` ${args.map(arg => `--tool-arg '${arg}'`).join(' ')}`;
  }

  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 15000 });
  } catch (error: any) {
    throw new Error(`MCP command failed: ${error.message}\nCommand: ${cmd}`);
  }
}

describe("FastMCP Server Tests", () => {

  test("should list all available tools", () => {
    const output = runMCPCommand("tools/list");
    expect(output).toContain("addPet");
    expect(output).toContain("getInventory");
    expect(output).toContain("loginUser");
  });

  describe("Pet Operations", () => {
    test("addPet - should accept pet object", async () => {
      const petData = JSON.stringify({
        name: "doggie",
        photoUrls: ["http://example.com/photo1.jpg"],
        status: "available"
      });
      const output = runMCPCommand("tools/call", "addPet", [`data=${petData}`]);
      expect(output).not.toContain("error");
    });

    test("updatePet - should accept pet object", async () => {
      const petData = JSON.stringify({
        id: 1,
        name: "doggie-updated",
        photoUrls: ["http://example.com/photo1.jpg"],
        status: "sold"
      });
      const output = runMCPCommand("tools/call", "updatePet", [`data=${petData}`]);
      expect(output).not.toContain("error");
    });

    test("findPetsByStatus - should accept status array", async () => {
      const output = runMCPCommand("tools/call", "findPetsByStatus", ['status=["available", "pending"]']);
      expect(output).not.toContain("error");
    });

    test("getPetById - should accept petId parameter", async () => {
      const output = runMCPCommand("tools/call", "getPetById", ["petId=1"]);
      // This test validates parameter passing works - API may return "Pet not found" which is expected
      expect(output).toContain("content");
    });
  });

  describe("Store Operations", () => {
    test("getInventory - should work without parameters", async () => {
      const output = runMCPCommand("tools/call", "getInventory");
      expect(output).not.toContain("error");
    });

    test("placeOrder - should accept order object", async () => {
      const orderData = JSON.stringify({
        petId: 1,
        quantity: 2,
        shipDate: "2024-01-01T00:00:00.000Z",
        status: "placed",
        complete: false
      });
      const output = runMCPCommand("tools/call", "placeOrder", [`data=${orderData}`]);
      expect(output).not.toContain("error");
    });

    test("getOrderById - should accept orderId parameter", async () => {
      const output = runMCPCommand("tools/call", "getOrderById", ["orderId=2"]);
      // This test validates parameter passing works - API may return "Order not found" which is expected
      expect(output).toContain("content");
    });
  });

  describe("User Operations", () => {
    test("createUser - should accept user object", async () => {
      const userData = JSON.stringify({
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "testpass",
        phone: "123-456-7890",
        userStatus: 1
      });
      const output = runMCPCommand("tools/call", "createUser", [`data=${userData}`]);
      expect(output).not.toContain("error");
    });

    test("loginUser - should accept username and password", async () => {
      const output = runMCPCommand("tools/call", "loginUser", [
        "username=testuser",
        "password=testpass"
      ]);
      expect(output).not.toContain("error");
    });

    test("getUserByName - should accept username parameter", async () => {
      const output = runMCPCommand("tools/call", "getUserByName", ["username=testuser"]);
      // This test validates parameter passing works - API may return "User not found" which is expected
      expect(output).toContain("content");
    });
  });
});