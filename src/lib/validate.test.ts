import { describe, it, expect } from "vitest"
import { isValidPublicIp, normalizeIp } from "./validate"

describe("isValidPublicIp", () => {
  describe("valid public IPs", () => {
    it("accepts valid public IPv4", () => {
      expect(isValidPublicIp("8.8.8.8")).toBe(true)
      expect(isValidPublicIp("1.1.1.1")).toBe(true)
      expect(isValidPublicIp("203.0.113.1")).toBe(true)
    })

    it("accepts valid public IPv6", () => {
      expect(isValidPublicIp("2001:4860:4860::8888")).toBe(true)
      expect(isValidPublicIp("2606:4700:4700::1111")).toBe(true)
    })
  })

  describe("private IPv4 ranges", () => {
    it("rejects 10.x.x.x", () => {
      expect(isValidPublicIp("10.0.0.1")).toBe(false)
      expect(isValidPublicIp("10.255.255.255")).toBe(false)
    })

    it("rejects 172.16-31.x.x", () => {
      expect(isValidPublicIp("172.16.0.1")).toBe(false)
      expect(isValidPublicIp("172.31.255.255")).toBe(false)
      expect(isValidPublicIp("172.15.0.1")).toBe(true)
      expect(isValidPublicIp("172.32.0.1")).toBe(true)
    })

    it("rejects 192.168.x.x", () => {
      expect(isValidPublicIp("192.168.0.1")).toBe(false)
      expect(isValidPublicIp("192.168.255.255")).toBe(false)
    })

    it("rejects loopback 127.x.x.x", () => {
      expect(isValidPublicIp("127.0.0.1")).toBe(false)
      expect(isValidPublicIp("127.255.255.255")).toBe(false)
    })

    it("rejects link-local 169.254.x.x", () => {
      expect(isValidPublicIp("169.254.0.1")).toBe(false)
      expect(isValidPublicIp("169.254.169.254")).toBe(false)
    })

    it("rejects CGNAT 100.64-127.x.x", () => {
      expect(isValidPublicIp("100.64.0.1")).toBe(false)
      expect(isValidPublicIp("100.127.255.255")).toBe(false)
      expect(isValidPublicIp("100.63.255.255")).toBe(true)
    })
  })

  describe("private IPv6 ranges", () => {
    it("rejects loopback ::1", () => {
      expect(isValidPublicIp("::1")).toBe(false)
    })

    it("rejects unique local fc::/7", () => {
      expect(isValidPublicIp("fc00::1")).toBe(false)
      expect(isValidPublicIp("fd00::1")).toBe(false)
    })

    it("rejects link-local fe80::/10", () => {
      expect(isValidPublicIp("fe80::1")).toBe(false)
    })

    it("rejects multicast ff::/8", () => {
      expect(isValidPublicIp("ff02::1")).toBe(false)
      expect(isValidPublicIp("ff00::1")).toBe(false)
    })
  })

  describe("invalid inputs", () => {
    it("rejects non-IP strings", () => {
      expect(isValidPublicIp("not-an-ip")).toBe(false)
      expect(isValidPublicIp("example.com")).toBe(false)
    })

    it("rejects empty string", () => {
      expect(isValidPublicIp("")).toBe(false)
    })

    it("rejects out-of-range octets", () => {
      expect(isValidPublicIp("999.999.999.999")).toBe(false)
      expect(isValidPublicIp("256.1.1.1")).toBe(false)
    })

    it("rejects malformed IP", () => {
      expect(isValidPublicIp("1.2.3")).toBe(false)
      expect(isValidPublicIp("1.2.3.4.5")).toBe(false)
    })
  })
})

describe("normalizeIp", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normalizeIp("  8.8.8.8  ")).toBe("8.8.8.8")
    expect(normalizeIp("\t1.1.1.1\n")).toBe("1.1.1.1")
  })

  it("lowercases IPv6 addresses", () => {
    expect(normalizeIp("2001:DB8::1")).toBe("2001:db8::1")
    expect(normalizeIp("FE80::1")).toBe("fe80::1")
  })

  it("leaves valid IPv4 unchanged", () => {
    expect(normalizeIp("8.8.8.8")).toBe("8.8.8.8")
  })
})
