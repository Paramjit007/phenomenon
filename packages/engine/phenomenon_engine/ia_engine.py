IA_COMPATIBILITY: dict[str, list[str]] = {
    "ad-actio":       ["co-implication", "ad-actio"],
    "de-actio":       ["non", "de-actio"],
    "non":            ["de-actio"],
    "co-implication": ["ad-actio", "co-implication"],
}


class IACompatibilityError(ValueError):
    pass


class IAEngine:
    def check_compatibility(self, new_type: str, existing_types: list[str]) -> None:
        allowed = IA_COMPATIBILITY.get(new_type, [])
        for existing in existing_types:
            if existing not in allowed:
                raise IACompatibilityError(
                    f"{new_type!r} is incompatible with existing IA {existing!r}"
                )

    def validate_set(self, ia_instances: list[str]) -> tuple[bool, list[str]]:
        errors = []
        for i, ia in enumerate(ia_instances):
            try:
                self.check_compatibility(ia, ia_instances[:i])
            except IACompatibilityError as e:
                errors.append(str(e))
        return len(errors) == 0, errors
