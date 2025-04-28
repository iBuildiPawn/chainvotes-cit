# ChainVotes Test Data Documentation

## Overview

This document describes the test datasets available in the ChainVotes platform and provides guidance on using them effectively.

## Available Datasets

### 1. National Election Dataset
- **File**: `national_election_candidates.csv`
- **Size**: 12 candidates
- **Positions**: President, Vice President, Senate, House Representative
- **Use Case**: Testing standard election scenarios
- **Features**: 
  - Diverse candidate backgrounds
  - Professional bios
  - Gender-balanced representation
  - High-quality avatar images

### 2. Stress Test Dataset
- **File**: `stress_test_candidates.csv`
- **Size**: 20 candidates
- **Positions**: Senate, House Representative
- **Use Case**: Performance testing and load analysis
- **Features**:
  - Large number of candidates per position
  - Extended bios
  - Various image URLs
  - Edge case testing

## Data Format Requirements

### Required Fields
```csv
name,position,bio,imageUrl
```

### Field Specifications

1. **name**
   - Full candidate name
   - Length: 2-50 characters
   - No special characters except hyphen and apostrophe

2. **position**
   - Must match existing position names exactly (case-insensitive)
   - Available positions depend on campaign setup

3. **bio**
   - Candidate biography
   - Length: 50-500 characters
   - Can include punctuation and formatting

4. **imageUrl**
   - HTTPS URL to candidate's profile image
   - Must return valid image format
   - Optional but recommended

## Best Practices

### Data Preparation
1. Validate position names before import
2. Test image URLs for accessibility
3. Review bios for length and formatting
4. Check for duplicate entries

### Import Process
1. Start with small test batch
2. Verify position matching
3. Preview candidate cards
4. Confirm image loading
5. Submit final batch

### Performance Considerations
- Optimal batch size: 15-20 candidates
- Image optimization recommended
- Consider network latency for image loading
- Monitor gas costs for large batches

## Example Usage

### Creating a New Dataset
```csv
name,position,bio,imageUrl
John Smith,President,"Experienced leader...",https://...
Jane Doe,Vice President,"Distinguished expert...",https://...
```

### Testing Edge Cases
1. Maximum bio length
2. Special characters in names
3. Missing optional fields
4. Various image formats
5. Position name variations

## Validation Rules

### Name Validation
- Required field
- Minimum 2 characters
- Maximum 50 characters
- Allowed characters: A-Z, a-z, space, hyphen, apostrophe

### Bio Validation
- Required field
- Minimum 50 characters
- Maximum 500 characters
- Support for basic punctuation
- No HTML/markdown

### Position Validation
- Required field
- Must match existing position
- Case-insensitive matching
- Spaces and special characters exact match required

### Image URL Validation
- Optional field
- Must be HTTPS URL
- Must return valid image
- Supported formats: JPG, PNG, WebP