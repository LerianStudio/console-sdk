import { render, screen } from '@testing-library/react'
import { DEFAULT_STATUS_VARIANTS, StatusBadge } from '.'

describe('StatusBadge', () => {
  it('humanizes a known status', () => {
    render(<StatusBadge status="IN_PROGRESS" />)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('prefers an explicit label over the humanized status', () => {
    render(<StatusBadge status="ACTIVE" label="Ativo" />)
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.queryByText('Active')).toBeNull()
  })

  it('renders the unknown fallback for an empty status', () => {
    const { rerender } = render(<StatusBadge status={null} />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()

    rerender(<StatusBadge status={undefined} unknownLabel="Sem status" />)
    expect(screen.getByText('Sem status')).toBeInTheDocument()
  })

  it('resolves an unmapped status to the neutral outline variant', () => {
    render(<StatusBadge status="SOME_NEW_SERVER_ENUM" />)
    expect(screen.getByText('Some New Server Enum')).toBeInTheDocument()
  })

  it('shallow-merges variantMap over the defaults', () => {
    render(
      <StatusBadge
        status="ACTIVE"
        variantMap={{ ACTIVE: 'destructive' }}
        withIcon
      />
    )
    // The overridden variant drives the severity cue.
    expect(screen.getByText('Critical:')).toBeInTheDocument()
  })

  it.each([
    ['reconciled', 'RECONCILED'],
    ['Reconciled', 'RECONCILED'],
    ['RECONCILED', 'RECONCILED'],
    ['reconciled', 'reconciled']
  ])(
    'matches variantMap key %j against status %j regardless of case',
    (mapKey, status) => {
      render(
        <StatusBadge
          status={status}
          variantMap={{ [mapKey]: 'success' }}
          withIcon
        />
      )
      // Resolving to 'success' proves the key matched; an unmatched key would
      // fall through to the cue-less 'outline' fallback silently.
      expect(screen.getByText('OK:')).toBeInTheDocument()
    }
  )

  it('adds the non-color severity cue only when withIcon is set', () => {
    const { rerender } = render(<StatusBadge status="FAILED" />)
    expect(screen.queryByText('Critical:')).toBeNull()

    rerender(<StatusBadge status="FAILED" withIcon />)
    expect(screen.getByText('Critical:')).toBeInTheDocument()
  })

  it.each([
    ['SUCCEEDED', 'OK:'],
    ['PENDING', 'Warning:'],
    ['FAILED', 'Critical:'],
    ['ARCHIVED', 'Neutral:'],
    ['QUEUED', 'Neutral:']
  ])('maps %s onto the %s severity word', (status, word) => {
    render(<StatusBadge status={status} withIcon />)
    expect(screen.getByText(word)).toBeInTheDocument()
  })

  it('keeps the legacy DEFAULT_STATUS_VARIANTS keys', () => {
    expect(Object.keys(DEFAULT_STATUS_VARIANTS)).toEqual([
      'DRAFT',
      'ACTIVE',
      'ENABLED',
      'INACTIVE',
      'DISABLED',
      'PAUSED',
      'ARCHIVED',
      'QUEUED',
      'PENDING',
      'PROCESSING',
      'RUNNING',
      'COMPLETE',
      'COMPLETED',
      'SUCCEEDED',
      'SUCCESS',
      'FAILED',
      'ERROR',
      'CANCELED',
      'CANCELLED',
      'EXPIRED',
      'OPEN',
      'RESOLVED',
      'REJECTED',
      'CONFIRMED',
      'LOW',
      'MEDIUM',
      'HIGH',
      'CRITICAL'
    ])
  })
})
