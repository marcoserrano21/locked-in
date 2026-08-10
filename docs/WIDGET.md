# Native widget MVP

Target: iOS WidgetKit + Android Glance after Capacitor wrap.

## Payload (written on persist)

```json
{
  "nowLabel": "Deep work",
  "streak": 12,
  "dayNum": 18,
  "lengthDays": 30,
  "updatedAt": "ISO-8601"
}
```

Source: next focus block from Today logic + `computeStreak` + challenge day.

## Behavior

- Refresh on app persist (debounced) and on widget timeline (~15–30 min)
- Tap opens `app.lockedin.marco://today` → `#today`
- Dark ink stage colors: bg `#070A10`, accent `#3ECF8E`

See [CAPACITOR.md](CAPACITOR.md) for install steps.
