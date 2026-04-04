import { type ICricketDataProvider, NoOpCricketProvider } from "./cricket-adapter"
import { SportMonksProvider } from "./sportmonks-provider"

function buildProvider(): ICricketDataProvider {
  const token = process.env.CRICKET_API_KEY
  if (token) {
    return new SportMonksProvider(
      token,
      process.env.CRICKET_API_BASE_URL ?? "https://cricket.sportmonks.com/api/v2.0",
      process.env.SPORTMONKS_SEASON_ID ?? "1795"
    )
  }
  return new NoOpCricketProvider()
}

let provider: ICricketDataProvider = buildProvider()

export function setCricketProvider(p: ICricketDataProvider) {
  provider = p
}

export function getCricketProvider(): ICricketDataProvider {
  return provider
}
