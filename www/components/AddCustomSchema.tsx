import { useState } from 'react';
import { is_valid_custom_schema } from '../lib/schemaValidator';
import defaultSchema from '../offer_schemas/QmX6CZ7Wf8B79EX5x1PJSityvhtvvFKhkDBCDZK2cd6adF.json';
import { DEFAULT_OFFER_SCHEMA } from '../lib/constants';
import { ArrowRightIcon, ArrowsExpandIcon, ArrowSmRightIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/solid';

export function InputCustomSchema(props: {
    JSONSchema: string;
    IPFSSchema: string;
    setJSONSchema: (schema: string) => void;
    setIPFSSchema: (schema: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [schemaType, setSchemaType] = useState('default');
    const setCustomSchemaJSON = props.setJSONSchema;
    const setCustomSchemaIPFS = props.setIPFSSchema;
    const customJSONSchema = props.JSONSchema;

    return (
        <div className="flex flex-col mt-8">
            <div hidden={expanded}>
                <div onClick={() => setExpanded(true)} className='font-bold text-sm mb-1 flex flex-row'><ChevronRightIcon className='h-4 w-4 my-auto' /> Buyer Fields: {schemaType == 'default' ? 'Default' : 'Custom'}</div>
            </div>
            <div hidden={!expanded}>
                <div onClick={() => setExpanded(false)} className='font-bold text-sm mb-1 flex flex-row'><ChevronDownIcon className='h-4 w-4 my-auto' /> Buyer Fields: {schemaType == 'default' ? 'Default' : 'Custom'}</div>
                <div>Use the <a className='underline' href="https://github.com/rwtp/rwtp/blob/main/www/offer_schemas/QmX6CZ7Wf8B79EX5x1PJSityvhtvvFKhkDBCDZK2cd6adF.json">default set</a> of buyer fields or define your own in <a className="underline" href="https://json-schema.org/">JSON Schema</a>:</div>
                <div className='flex flex-col mb-4'>
                    <div className='flex flex-row gap-1 items-center'>
                        <input
                            type="radio" value="default" name="schema"
                            defaultChecked={true}
                            onClick={() => {
                                setSchemaType('default');
                                setCustomSchemaJSON('');
                                setCustomSchemaIPFS('');
                            }}
                        />
                        <div>Default</div>
                    </div>
                    <div className='flex flex-row gap-1 items-center'>
                        <input
                            type="radio" value="ipfs" name="schema"
                            onClick={() => {
                                setSchemaType('ipfs');
                                setCustomSchemaJSON('');
                                setCustomSchemaIPFS('');
                            }}
                        />
                        <div>Custom IPFS URI</div>
                    </div>
                    <div className='flex flex-row gap-1 items-center'>
                        <input
                            type="radio" value="json" name="schema"
                            onClick={() => {
                                setSchemaType('json');
                                setCustomSchemaJSON('');
                                setCustomSchemaIPFS('');
                            }}
                        />
                        <div>Custom JSON upload</div>
                    </div>
                </div>
                {schemaType == 'ipfs' && <div>
                    <div className="flex flex-col">
                        <div className="font-bold text-sm mb-1">Custom Schema</div>
                        <input
                            className="border px-4 py-2 rounded"
                            type="string"
                            placeholder={`ipfs://${DEFAULT_OFFER_SCHEMA}`}
                            onChange={(e) =>
                                setCustomSchemaIPFS(e.target.value)
                            }
                        />
                    </div>
                </div>}
                {schemaType == 'json' && <div>
                    <div className="flex flex-col">
                        <div className="font-bold text-sm mb-1">Custom Schema</div>
                        <textarea
                            rows={10}
                            className="border px-4 py-2 rounded font-mono text-sm text-gray-700"
                            placeholder={JSON.stringify(defaultSchema, null, 2)}
                            onChange={(e) =>
                                setCustomSchemaJSON(e.target.value)
                            }
                        />
                        {customJSONSchema && is_valid_custom_schema(customJSONSchema) ? (
                            <div className="text-sm text-green-500">
                                JSON is valid!
                            </div>
                        ) : (
                            <div className="text-sm text-red-500">
                                Invalid JSON
                            </div>
                        )}
                    </div>
                </div>}
            </div>
        </div>
    );
}