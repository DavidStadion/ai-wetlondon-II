#!/usr/bin/env python3
"""
Script to add wetnessScore to all venues in data.js
Calculates score based on walking distance, wetness level, and covered status
"""

import re
import json

def calculate_wetness_score(venue_text):
    """
    Calculate wetness score (0-100) based on venue properties
    
    0 = completely dry, direct indoor access
    100 = mostly outdoors
    
    Factors:
    - Walking distance from transport (0-40 points)
    - Indoor vs outdoor nature (0-40 points)
    - Covered access (0-20 points)
    """
    score = 0
    
    # Extract tubeDistance if present
    tube_distance_match = re.search(r'tubeDistance:\s*["\'](\d+)\s*min', venue_text)
    if tube_distance_match:
        minutes = int(tube_distance_match.group(1))
        if minutes <= 2:
            score += 0
        elif minutes <= 5:
            score += 10
        elif minutes <= 10:
            score += 25
        else:
            score += 40
    else:
        # If no tubeDistance specified, infer from description
        desc_match = re.search(r'description:\s*["\']([^"\']+)["\']', venue_text)
        if desc_match:
            desc = desc_match.group(1).lower()
            if 'direct' in desc or 'adjacent' in desc:
                score += 0
            elif '2 min' in desc or '3 min' in desc:
                score += 5
            elif '5 min' in desc:
                score += 10
            else:
                score += 15
    
    # Extract wetness level
    wetness_match = re.search(r'wetness:\s*["\'](\w+)["\']', venue_text)
    if wetness_match:
        wetness = wetness_match.group(1)
        if wetness == 'dry':
            score += 0
        elif wetness == 'slightly':
            score += 20
        elif wetness == 'wet':
            score += 40
    
    # Check if covered
    if 'covered: true' in venue_text:
        score += 0
    elif 'covered: false' in venue_text:
        score += 20
    else:
        # Infer from type
        if 'type: [' in venue_text:
            type_match = re.search(r'type:\s*\[([^\]]+)\]', venue_text)
            if type_match:
                types = type_match.group(1)
                # Outdoor-heavy types
                if 'markets' in types or 'parks' in types:
                    score += 15
                # Indoor types
                elif any(t in types for t in ['museums', 'galleries', 'cinema', 'theatre', 'libraries']):
                    score += 0
                else:
                    score += 5
    
    # Cap at 100
    return min(score, 100)


def add_wetness_scores(input_file, output_file):
    """Add wetnessScore to all venues in data.js"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all venue objects
    # Pattern: find objects between { and matching }
    venues_pattern = r'(\{\s*name:[^}]+?(?:openingHours:\s*\{[^}]+\}\s*)?)\}'
    
    def add_score_to_venue(match):
        venue_text = match.group(1)
        
        # Check if wetnessScore already exists
        if 'wetnessScore:' in venue_text:
            return match.group(0)  # Return unchanged
        
        # Calculate score
        score = calculate_wetness_score(venue_text)
        
        # Find where to insert (after 'wetness' field)
        if 'wetness:' in venue_text:
            # Insert after wetness field
            modified = re.sub(
                r'(wetness:\s*["\'][^"\']+["\'],)',
                f'\\1\n        wetnessScore: {score},',
                venue_text
            )
            return modified + '}'
        else:
            # If no wetness field, add after location
            modified = re.sub(
                r'(location:\s*["\'][^"\']+["\'],)',
                f'\\1\n        wetnessScore: 50,',
                venue_text
            )
            return modified + '}'
    
    # Process all venues
    modified_content = re.sub(venues_pattern, add_score_to_venue, content, flags=re.DOTALL)
    
    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(modified_content)
    
    print(f"✓ Updated {output_file}")
    print(f"  Added wetnessScore to all venues")


if __name__ == '__main__':
    input_file = '/Users/dhstadion/projects/ai-wetlondon/js/data.js'
    output_file = '/Users/dhstadion/projects/ai-wetlondon/js/data.js'
    
    add_wetness_scores(input_file, output_file)
