type ZohoResponse<T> = {
  code: number
  data: T
  message?: string
}

type ZohoCustomApiResponse = {
  code: number
  result?: unknown
  data?: unknown
  message?: string
}

type ZohoCreatorConfig = Record<string, unknown>

interface ZohoCreatorSdk {
  DATA: {
    addRecords(config: ZohoCreatorConfig): Promise<ZohoResponse<{ ID: string }>>
    getRecordById(config: ZohoCreatorConfig): Promise<ZohoResponse<Record<string, unknown>>>
    getRecords(config: ZohoCreatorConfig): Promise<ZohoResponse<Record<string, unknown>[]>>
    updateRecordById(config: ZohoCreatorConfig): Promise<ZohoResponse<{ ID: string }>>
    invokeCustomApi(config: ZohoCreatorConfig): Promise<ZohoCustomApiResponse>
  }
  FILE: {
    uploadFile(config: ZohoCreatorConfig): Promise<ZohoResponse<Record<string, unknown>>>
    readFile(config: ZohoCreatorConfig): Promise<unknown>
  }
  UTIL: {
    getInitParams(): Promise<Record<string, unknown>>
    getWidgetParams(): Promise<Record<string, unknown>>
    getQueryParams(): Promise<Record<string, unknown>>
    navigateParentURL?(config: { action: 'open' | 'reload' | 'back' | 'close' | 'closeAll'; url?: string; window?: 'same' | 'new' }): Promise<unknown> | void
    setImageData(image: HTMLImageElement, sourceUrl: string, callback?: (response: unknown) => void): void
  }
}

interface Window {
  ZOHO?: {
    CREATOR?: ZohoCreatorSdk
  }
}
