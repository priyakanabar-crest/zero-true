from pydantic import Field, validator
from typing import Optional
from zt_backend.models.components.zt_component import ZTComponent
from zt_backend.models.validations import validate_color, validate_min_less_than_max
class Slider(ZTComponent):
    """A class for Slider components inheriting from ZTComponent."""
    component: str = Field("v-slider", description="Vue component name.")
    value: int = Field(0, description="Current value of the slider.")
    min: int = Field(0, ge=0, description="Minimum value of the slider.")
    max: int = Field(100, ge=0, description="Maximum value of the slider.")
    step: int = Field(1, gt=0, description="Step increment of the slider.")
    thumb_label: bool = Field(False, description="Displays the thumb label.")
    thumb_size: int = Field(0, description="Size of the thumb.")
    tick_labels: bool = Field(False, description="Displays the tick labels.")
    ticks: list = Field([], description="Displays the ticks.")
    color: str = Field('primary', pre=True, description="Color of the range slider. Can be custom or standard Material color.")
    size: str = Field('large', description="Size of the slider.")
    rounded: bool = Field(True, description="Determines if the slider has rounded edges.")
    
    @validator('color', allow_reuse=True, pre=True)
    def validate_color(cls, color):
        return validate_color(color)