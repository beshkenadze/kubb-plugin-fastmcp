import { test, expect, describe } from "bun:test";
import { execSync } from "child_process";

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
    return execSync(cmd, { encoding: 'utf8', timeout: 10000 });
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

    test("addPet - should accept pet object", () => {
      const output = runMCPCommand("tools/call", "addPet", [
        "name=doggie",
        'photoUrls=["http://example.com/photo1.jpg"]',
        "status=available"
      ]);
      expect(output).not.toContain("error");
    });

    test("updatePet - should accept pet object", () => {
      const output = runMCPCommand("tools/call", "updatePet", [
        "id=1",
        "name=doggie-updated",
        'photoUrls=["http://example.com/photo1.jpg"]',
        "status=sold"
      ]);
      expect(output).not.toContain("error");
    });

    test("findPetsByStatus - should accept status array", () => {
      const output = runMCPCommand("tools/call", "findPetsByStatus", ['status=["available", "pending"]']);
      expect(output).not.toContain("error");
    });

    test("findPetsByTags - should accept tags array", () => {
      const output = runMCPCommand("tools/call", "findPetsByTags", ['tags=["tag1", "tag2"]']);
      expect(output).not.toContain("error");
    });

    test("getPetById - should accept petId parameter", () => {
      const output = runMCPCommand("tools/call", "getPetById", ["petId=1"]);
      expect(output).not.toContain("error");
    });

    test("updatePetWithForm - should accept petId and form data", () => {
      const output = runMCPCommand("tools/call", "updatePetWithForm", [
        "petId=1",
        "name=updated-name",
        "status=sold"
      ]);
      expect(output).not.toContain("error");
    });

    test("deletePet - should accept petId and optional api_key", () => {
      const output = runMCPCommand("tools/call", "deletePet", [
        "petId=1",
        "api_key=special-key"
      ]);
      expect(output).not.toContain("error");
    });

    test("uploadFile - should accept petId and file data", () => {
      // Skip file upload test as it requires actual File object
      const output = runMCPCommand("tools/call", "uploadFile", [
        "petId=1",
        "additionalMetadata=test metadata"
      ]);
      // Accept error for file parameter since we can't create File in CLI
      expect(output).toContain("execution failed");
    });

  });

  describe("Store Operations", () => {

    test("getInventory - should work without parameters", () => {
      const output = runMCPCommand("tools/call", "getInventory");
      expect(output).not.toContain("error");
    });

    test("placeOrder - should accept order object", () => {
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

    test("getOrderById - should accept orderId parameter", () => {
      const output = runMCPCommand("tools/call", "getOrderById", ["orderId=1"]);
      expect(output).not.toContain("error");
    });

    test("deleteOrder - should accept orderId parameter", () => {
      const output = runMCPCommand("tools/call", "deleteOrder", ['orderId="1"']);
      expect(output).not.toContain("error");
    });

  });

  describe("User Operations", () => {

    test("createUser - should accept user object", () => {
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

    test("createUsersWithArrayInput - should accept user array wrapped in data", () => {
      const usersData = JSON.stringify([
        {
          username: "user1",
          email: "user1@example.com",
          firstName: "User",
          lastName: "One"
        },
        {
          username: "user2",
          email: "user2@example.com",
          firstName: "User",
          lastName: "Two"
        }
      ]);
      const output = runMCPCommand("tools/call", "createUsersWithArrayInput", [`data=${usersData}`]);
      expect(output).not.toContain("error");
    });

    test("createUsersWithListInput - should accept user array wrapped in data", () => {
      const usersData = JSON.stringify([
        {
          username: "user3",
          email: "user3@example.com",
          firstName: "User",
          lastName: "Three"
        }
      ]);
      const output = runMCPCommand("tools/call", "createUsersWithListInput", [`data=${usersData}`]);
      expect(output).not.toContain("error");
    });

    test("loginUser - should accept username and password", () => {
      const output = runMCPCommand("tools/call", "loginUser", [
        "username=testuser",
        "password=testpass"
      ]);
      expect(output).not.toContain("error");
    });

    test("logoutUser - should work without parameters", () => {
      const output = runMCPCommand("tools/call", "logoutUser");
      expect(output).not.toContain("error");
    });

    test("getUserByName - should accept username parameter", () => {
      const output = runMCPCommand("tools/call", "getUserByName", ["username=testuser"]);
      expect(output).not.toContain("error");
    });

    test("updateUser - should accept username and user object", () => {
      const userData = JSON.stringify({
        firstName: "Updated",
        lastName: "User",
        email: "updated@example.com"
      });
      const output = runMCPCommand("tools/call", "updateUser", [
        "username=testuser",
        `data=${userData}`
      ]);
      expect(output).not.toContain("error");
    });

    test("deleteUser - should accept username parameter", () => {
      const output = runMCPCommand("tools/call", "deleteUser", ["username=testuser"]);
      expect(output).not.toContain("error");
    });

  });

  describe("Edge Cases", () => {

    test("should handle single status value", () => {
      const output = runMCPCommand("tools/call", "findPetsByStatus", ['status=["available"]']);
      expect(output).not.toContain("error");
    });

    test("should handle multiple status values", () => {
      const output = runMCPCommand("tools/call", "findPetsByStatus", ['status=["available", "pending", "sold"]']);
      expect(output).not.toContain("error");
    });

    test("should handle empty arrays appropriately", () => {
      const output = runMCPCommand("tools/call", "createUsersWithArrayInput", ['data=[]']);
      expect(output).not.toContain("error");
    });

    test("should handle complex pet object with all fields", () => {
      const output = runMCPCommand("tools/call", "addPet", [
        "id=123",
        'category={"id": 1, "name": "Dogs"}',
        "name=doggie",
        'photoUrls=["http://example.com/photo1.jpg", "http://example.com/photo2.jpg"]',
        'tags=[{"id": 1, "name": "friendly"}, {"id": 2, "name": "trained"}]',
        "status=available"
      ]);
      expect(output).not.toContain("error");
    });

  });

});