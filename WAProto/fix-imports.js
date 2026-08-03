import{readFileSync,writeFileSync}from"fs";import{exit}from"process";const filePath="./index.js";try{let content=readFileSync(filePath,"utf8");content=content.replace(/import \* as (\$protobuf) from/g,"import $1 from"),content=content.replace(/(['"])protobufjs\/minimal(['"])/g,"$1protobufjs/minimal.js$2");const marker=`const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

`,longToStringHelper=`function longToString(value, unsigned) {
	if (typeof value === "string") {
		return value;
	}
	if (typeof value === "number") {
		return String(value);
	}
	if (!$util.Long) {
		return String(value);
	}
	const normalized = $util.Long.fromValue(value);
	const prepared = unsigned && normalized && typeof normalized.toUnsigned === "function"
		? normalized.toUnsigned()
		: normalized;
	return prepared.toString();
}

`,longToNumberHelper=`function longToNumber(value, unsigned) {
	if (typeof value === "number") {
		return value;
	}
	if (typeof value === "string") {
		const numeric = Number(value);
		return numeric;
	}
	if (!$util.Long) {
		return Number(value);
	}
	const normalized = $util.Long.fromValue(value);
	const prepared = unsigned && normalized && typeof normalized.toUnsigned === "function"
		? normalized.toUnsigned()
		: typeof normalized.toSigned === "function"
			? normalized.toSigned()
			: normalized;
	return prepared.toNumber();
}

`;if(content.includes("function longToString(")){const longToStringRegex=/function longToString\(value, unsigned\) {\n[\s\S]*?\n}\n\n/,longToNumberRegex=/function longToNumber\(value, unsigned\) {\n[\s\S]*?\n}\n\n/;if(!longToStringRegex.test(content)||!longToNumberRegex.test(content))throw new Error("Unable to update Long helpers: existing definitions not found");content=content.replace(longToStringRegex,longToStringHelper),content=content.replace(longToNumberRegex,longToNumberHelper)}else{if(content.indexOf(marker)===-1)throw new Error("Unable to inject Long helpers: marker not found in WAProto index output");content=content.replace(marker,`${marker}${longToStringHelper}${longToNumberHelper}`)}const longPattern=/([ \t]+d\.(\w+) = )o\.longs === String \? \$util\.Long\.prototype\.toString\.call\(m\.\2\) : o\.longs === Number \? new \$util\.LongBits\(m\.\2\.low >>> 0, m\.\2\.high >>> 0\)\.toNumber\((true)?\) : m\.\2;/g;content=content.replace(longPattern,(_match,prefix,field,unsignedFlag)=>{const unsignedArg=unsignedFlag?", true":"";return`${prefix}o.longs === String ? longToString(m.${field}${unsignedArg}) : o.longs === Number ? longToNumber(m.${field}${unsignedArg}) : m.${field};`}),writeFileSync(filePath,content,"utf8"),console.log(`\u2705 Fixed imports in ${filePath}`)}catch(error){console.error(`\u274C Error fixing imports: ${error.message}`),exit(1)}
