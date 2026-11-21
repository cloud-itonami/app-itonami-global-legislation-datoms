# Yataverse storage receipts

Each file here is the unmodified output of `yataverse put <file>` for one committed projection file
under `data/` or `schema/` (51 files, 195,888,260 bytes), written on 2026-11-21 (AWAI-3624) with the
`kotoba-lang/yataverse` CLI at `f3771ee2`, against `https://yataverse.com`. The file name is the path
of the source file with `/` written as `--`.

- `cid` is the same identifier as the row for that path in `../cid-manifest.edn`.
- `receipt` is the signed storage receipt returned by the service. Receipts are not retrievable by
  `receiptCid`, so these files are the only copy.
- What a receipt says is defined in `kotoba-lang/yataverse` `docs/storage-receipt-design.md`. Every
  receipt here has `state` 1 (`local-durable-readback`: written to the store and read back with a
  matching digest), `storeClass` 1 (`edge-gateway`: the yataverse.com entry and its B2 store) and
  `retentionUntil` 0, which by that definition promises no future retention. An `edge-gateway`
  receipt is not counted as an independent replica.
- So these receipts show that the bytes were accepted and stored once. They are not a reason to
  remove the files from this repository.

Check a receipt against the file it is for:

    yataverse verify-receipt storage/yataverse-receipts/data--provenance.edn.json \
      --file data/provenance.edn --kind block

Check that a block is still served and hashes to its CID:

    yataverse verify <cid>

On 2026-11-21 all 51 blocks were read back with `yataverse get` and were byte-identical to the
committed files, and all 51 receipts verified against their files.

The law texts themselves are not in this repository and were not written.
