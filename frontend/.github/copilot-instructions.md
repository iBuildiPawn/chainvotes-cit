# Instructions

// ...existing code...

# Lessons

## User Specified Lessons

// ...existing code...

## Cursor learned

// ...existing code...
- For vote counts, fetch individual votes using getVoteCount since there's no bulk getter function
- Build vote count mapping by position ID and candidate ID after fetching individual counts
- When contract function is missing, check the actual contract code instead of assuming ABI is complete
- Organize vote count data structure by position to make it easier to display results by position
- Use multicall to batch fetch related contract data in parallel to reduce network round trips
- Process contract data transformations in memory before updating state to minimize rerenders
- Memoize derived state calculations to prevent unnecessary recalculations
- Type multicall results carefully to ensure type safety with contract interactions
- Combine parallel Promise.all with multicall for maximum network efficiency
- Define reusable contract configs to maintain consistent ABI typing across calls
- When using custom RPC endpoints, always include public fallbacks with CORS support for better reliability
- Use wagmi's fallback transport to handle RPC endpoint failures gracefully
- Prefer well-known public RPC endpoints (Alchemy, Infura) as fallbacks for better CORS support
- Keep at least 2-3 fallback RPC endpoints to ensure high availability
- Configure HTTP transport timeouts and retry settings to handle transient RPC issues
- Use reasonable retry delays (1000ms+) to avoid overwhelming RPC endpoints
- Set appropriate timeouts (10s+) for blockchain operations that may take longer
- Apply consistent transport settings across all RPC endpoints for predictable behavior
- Monitor RPC endpoint health and adjust retry settings based on real-world performance

# Scratchpad

Current Task: Enhance Button Text Contrast

Progress:
[X] Update Button component base styles
  - Set default variant text to black
  - Enhanced font weights for better visibility
  - Improved hover state contrast
[X] Improve theme configuration
  - Added specific button text color variables
  - Enhanced contrast ratios for all button states
  - Added consistent text color mapping
[X] Update button instances across components
  - Enhanced CampaignWizard step indicators
  - Fixed CampaignList action buttons
  - Improved WalletConnect button contrast
  - Enhanced PositionPreview action buttons
  - Fixed CampaignForm submit button
  - Made dashboard Create Campaign button more prominent

Key Improvements:
- Default buttons now use black text on primary background
- Outline variant uses primary color for better visibility
- Consistent font weights across button types
- Enhanced hover state contrast
- Better visual hierarchy for primary actions
- Improved loading state visibility
- WCAG compliant contrast ratios

Benefits:
- Better accessibility
- Improved user experience
- Consistent visual language
- Clear action hierarchy
- Better visibility in all themes

Current Task: Optimize Gas Costs for Position Management

Progress:
[ ] Analyze current gas usage
  - Identify high-cost operations in position management
  - Measure gas usage for different numbers of positions
  - Determine gas usage patterns and bottlenecks
[ ] Implement contract optimizations
  - Optimize position storage structure
  - Reduce redundant operations
  - Minimize state changes
[ ] Enhance batch operations
  - Improve batch position addition efficiency
  - Optimize gas for large batches
  - Implement gas estimation for user feedback
[ ] Add UI feedback for gas costs
  - Provide gas estimates before transactions
  - Show approximate cost in ETH/USD
  - Add gas optimization tips

Next Steps:
[ ] Review contract position storage pattern
[ ] Benchmark gas usage with different position counts
[ ] Implement optimized addPositionsBatch function
[ ] Add gas estimation feedback to UI

Previous Task Progress below:

Current Task: Enhance Position Preview UI for Long Lists

Progress:
[X] Fix scrollbar issue in the PositionPreview component
  - Added flex structure to modal layout
  - Implemented overflow-y-auto for scrollable content
  - Set max-height constraints to prevent overflow
  - Added border separators for visual clarity
  - Ensured buttons remain visible with border-t and flex-shrink-0
[X] Improve visual hierarchy
  - Separated header and footer from scrolling content
  - Added border separators for better visual structure
  - Made buttons always accessible at the bottom of the modal

Next Steps:
[ ] Apply same pattern to CandidatePreview component if needed
[ ] Test with various screen sizes

Previous Task Progress below:

Current Task: Fix Campaign Details Navigation

Progress:
[X] Remove deprecated campaign details page
  - Replaced with redirect to dashboard
  - Added code comments explaining split
[X] Verify campaign page routes
  - /campaigns/[id]/vote for voting interface
  - /campaigns/[id]/results for results view
[X] Update navigation
  - Direct access to campaign details redirects to dashboard
  - Links from dashboard point to specific views
  - Maintain proper back navigation

Next Steps:
[ ] Test navigation flow
  - Verify redirects work correctly
  - Check all navigation paths
  - Test back button behavior
[ ] Update any remaining references
  - Check for any links to the old details page
  - Update documentation if needed
[ ] Verify user experience
  - Ensure smooth navigation between pages
  - Check loading states during transitions
  - Test error handling

Previous Task Progress below:

Current Task: Fix Vote Count Display

Progress:
[X] Identify missing getVoteCounts function in contract
[X] Update useVoting hook to fetch individual vote counts
[X] Organize vote counts by position ID
[X] Validate changes with error checking

Next Steps:
[ ] Test vote count display with multiple votes
[ ] Verify performance with large number of candidates
[ ] Add error handling for failed vote count fetches
[ ] Consider adding batch vote count getter to contract

Current Task: Optimize Vote Count Performance

Progress:
[X] Identify performance bottlenecks
  - Multiple sequential network calls
  - Unnecessary data transformations
  - Missing memoization
[X] Implement batched data fetching
  - Added multicall for candidates
  - Added multicall for vote counts
  - Parallel execution of both calls
[X] Optimize state updates
  - Single state update after processing
  - Memoized getter function
  - Type-safe data transformations
[X] Fix type system issues
  - Correct viem type imports
  - Type-safe multicall results
  - Proper generic constraints

Next Steps:
[ ] Test optimizations
  - Verify performance with large datasets
  - Check memory usage
  - Monitor network calls
[ ] Monitor user experience
  - Measure render times
  - Check for UI jank
  - Verify data consistency

Previous Task Progress below:

Current Task: Circuit Breaker Enhancement

Next Steps (Priority Order):
[ ] Monitor RPC failures
  - Track failed requests per endpoint
  - Record error types and frequencies
  - Set alerting thresholds
[ ] Implement circuit breaker
  - Add failure count tracking
  - Set threshold for endpoint removal
  - Add cool-down period
  - Add retry with exponential backoff
[ ] Enhance transport monitoring
  - Add response time tracking
  - Log request/response metrics
  - Add health check endpoint
[ ] Documentation
  - Add circuit breaker configuration docs
  - Document failover behavior
  - Add troubleshooting guide

Previous Task Progress below:

Current Task: Fix CORS Issues

Progress:
[X] Identify CORS error with DRPC endpoint
[X] Update wagmi configuration with fallback RPCs
[X] Add public RPC endpoints with CORS support
[X] Remove unsupported ranking config
[X] Validate configuration changes
[X] Add transport retry configuration
[X] Configure appropriate timeouts
[X] Apply consistent settings to all endpoints
[X] Add type safety to transport config

// ...rest of existing scratchpad...