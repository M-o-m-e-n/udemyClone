export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface JwtPayloadWithRefreshToken extends JwtPayload {
  refreshToken: string;
}
