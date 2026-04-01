import { type ICricketDataProvider, NoOpCricketProvider } from "./cricket-adapter"

let provider: ICricketDataProvider = new NoOpCricketProvider()

export function setCricketProvider(p: ICricketDataProvider) {
  provider = p
}

export function getCricketProvider(): ICricketDataProvider {
  return provider
}
