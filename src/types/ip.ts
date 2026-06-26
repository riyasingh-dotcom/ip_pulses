export type AsnInfo = {
  asn: string
  name: string
  domain: string
  route: string
  type: string
}

export type CompanyInfo = {
  name: string
  domain: string
  type: string
}

export type AbuseInfo = {
  address: string
  country: string
  email: string
  name: string
  network: string
  phone: string
}

export type PrivacyInfo = {
  vpn: boolean
  proxy: boolean
  tor: boolean
  relay: boolean
  hosting: boolean
  service: string
}

export type IpLookupResult = {
  ip: string
  resolvedFrom?: string
  hostname?: string
  city?: string
  region?: string
  country?: string
  loc?: string
  org?: string
  postal?: string
  timezone?: string
  asn?: AsnInfo
  company?: CompanyInfo
  abuse?: AbuseInfo
  privacy?: PrivacyInfo
}

export type LookupErrorResponse = {
  error: string
}

export type LookupApiResponse = IpLookupResult | LookupErrorResponse
