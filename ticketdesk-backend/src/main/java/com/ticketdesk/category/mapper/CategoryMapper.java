package com.ticketdesk.category.mapper;

import com.ticketdesk.category.dto.CategoryDto;
import com.ticketdesk.category.entity.Category;

public class CategoryMapper {

    public static CategoryDto mapToCategoryDto(Category category) {
        if (category == null) return null;
        return new CategoryDto(
                category.getId(),
                category.getName(),
                category.getDescription()
        );
    }

    public static Category mapToCategory(CategoryDto categoryDto) {
        if (categoryDto == null) return null;
        return new Category(
                categoryDto.getId(),
                categoryDto.getName(),
                categoryDto.getDescription()
        );
    }
}
