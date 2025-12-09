
import json
import re
import sys

def reformat_json_ingredients_to_diff(json_string):
    diffs = []
    
    # This pattern specifically targets the multi-line "amount" and "unit" objects within "ingredients"
    # and captures them, along with surrounding indentation and the optional trailing comma.
    pattern = re.compile(
