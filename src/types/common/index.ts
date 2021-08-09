export type Flavor<TType, TFlavor> = TType & { __meta?: TFlavor }

export type UUID = Flavor<string, 'UUID'>

export type URI = Flavor<string, 'URI'>

export type DateString = Flavor<string, 'DateString'>
export type DateTimeString = Flavor<string, 'DateTimeString'>
export type TimeString = Flavor<string, 'TimeString'>
