# Data handling

`sample/` contains synthetic demonstration exports, not genuine Windows evidence. Place raw case exports in a separate read-only case directory, preserve originals, and pass that directory to the pipeline. Normalization stores a copy of each raw record in the database without overwriting the source.

